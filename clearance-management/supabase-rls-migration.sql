-- ============================================================
-- RLS MIGRATION — Phase 1 fixes
-- Run this in Supabase SQL Editor against your project
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. SECURITY DEFINER helper: is_admin()
--    Avoids recursive subqueries in every policy.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ────────────────────────────────────────────────────────────
-- 2. USERS TABLE — drop old policies, recreate with is_admin()
--    Also add cross-role visibility policy for join fetches.
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view all users"    ON users;
DROP POLICY IF EXISTS "Admins can insert users"      ON users;
DROP POLICY IF EXISTS "Admins can update users"      ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Own row
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admin sees all
CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (is_admin());

-- Cross-role: teacher can see student rows linked via clearances,
-- and users can see teacher rows linked via subjects they are enrolled in.
CREATE POLICY "Users visible through clearance links" ON users
  FOR SELECT USING (
    -- Teacher can read the student's row
    EXISTS (
      SELECT 1 FROM clearances
      WHERE clearances.teacher_id = auth.uid()
        AND clearances.student_id = users.id
    )
    OR
    -- Student can read their teacher's row
    EXISTS (
      SELECT 1 FROM clearances
      WHERE clearances.student_id = auth.uid()
        AND clearances.teacher_id = users.id
    )
    OR
    -- Anyone can read rows that are subject teachers (subjects are public)
    EXISTS (
      SELECT 1 FROM subjects
      WHERE subjects.teacher_id = users.id
    )
  );

-- Admin insert / update
CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 3. SUBJECTS TABLE — replace recursive subquery with is_admin()
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

CREATE POLICY "Admins can manage subjects" ON subjects
  FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 4. CLEARANCES TABLE — replace recursive subqueries + add WITH CHECK
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Students can view their own clearances"     ON clearances;
DROP POLICY IF EXISTS "Teachers can update their subject clearances" ON clearances;
DROP POLICY IF EXISTS "Admins can manage all clearances"           ON clearances;

CREATE POLICY "Students can view their own clearances" ON clearances
  FOR SELECT USING (
    student_id = auth.uid()
    OR teacher_id = auth.uid()
    OR is_admin()
  );

-- Teacher update: explicit WITH CHECK so they can't re-assign teacher_id
CREATE POLICY "Teachers can update their subject clearances" ON clearances
  FOR UPDATE
  USING  (teacher_id = auth.uid() OR is_admin())
  WITH CHECK (teacher_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can manage all clearances" ON clearances
  FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 5. CLEARANCE HISTORY — replace recursive subqueries with is_admin()
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view clearance history"        ON clearance_history;
DROP POLICY IF EXISTS "Teachers and admins can insert history"  ON clearance_history;

CREATE POLICY "Users can view clearance history" ON clearance_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clearances c
      WHERE c.id = clearance_history.clearance_id
        AND (c.student_id = auth.uid() OR c.teacher_id = auth.uid())
    )
    OR is_admin()
  );

CREATE POLICY "Teachers and admins can insert history" ON clearance_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- ────────────────────────────────────────────────────────────
-- 6. SYSTEM SETTINGS — replace recursive subquery with is_admin()
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Only admins can manage settings" ON system_settings;

CREATE POLICY "Only admins can manage settings" ON system_settings
  FOR ALL USING (is_admin());

-- ────────────────────────────────────────────────────────────
-- 7. RPC: get_clearance_stats — aggregate server-side (Phase 4.2)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_clearance_stats(
  p_user_id  uuid  DEFAULT NULL,
  p_role     text  DEFAULT NULL
)
RETURNS json
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'total',      COUNT(*),
    'cleared',    COUNT(*) FILTER (WHERE status = 'cleared'),
    'pending',    COUNT(*) FILTER (WHERE status = 'pending'),
    'rejected',   COUNT(*) FILTER (WHERE status = 'rejected'),
    'held',       COUNT(*) FILTER (WHERE status = 'held'),
    'deficiency', COUNT(*) FILTER (WHERE status = 'deficiency')
  )
  FROM clearances
  WHERE
    CASE
      WHEN p_role = 'student' AND p_user_id IS NOT NULL THEN student_id = p_user_id
      WHEN p_role = 'teacher' AND p_user_id IS NOT NULL THEN teacher_id = p_user_id
      ELSE TRUE
    END;
$$;

-- ============================
-- STUDENT CLEARANCE MANAGEMENT SYSTEM
-- Database Schema for Supabase
-- ============================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================
-- USERS TABLE
-- ============================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')),
  name TEXT NOT NULL,
  student_id TEXT UNIQUE,
  department TEXT,
  year_level INTEGER,
  section TEXT,
  avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- SUBJECTS TABLE
-- ============================
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  department TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- CLEARANCES TABLE
-- ============================
CREATE TABLE clearances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'cleared', 'rejected', 'held', 'deficiency')),
  remarks TEXT,
  cleared_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, subject_id)
);

-- ============================
-- CLEARANCE HISTORY TABLE
-- ============================
CREATE TABLE clearance_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clearance_id UUID REFERENCES clearances(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  remarks TEXT,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- SYSTEM SETTINGS TABLE
-- ============================
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================
-- INDEXES
-- ============================
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_clearances_student_id ON clearances(student_id);
CREATE INDEX idx_clearances_teacher_id ON clearances(teacher_id);
CREATE INDEX idx_clearances_status ON clearances(status);
CREATE INDEX idx_subjects_teacher_id ON subjects(teacher_id);
CREATE INDEX idx_clearance_history_clearance_id ON clearance_history(clearance_id);

-- ============================
-- ROW LEVEL SECURITY (RLS)
-- ============================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE clearance_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users" ON users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update users" ON users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subjects policies
CREATE POLICY "Everyone can view subjects" ON subjects
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage subjects" ON subjects
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clearances policies
CREATE POLICY "Students can view their own clearances" ON clearances
  FOR SELECT USING (
    student_id = auth.uid() OR
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can update their subject clearances" ON clearances
  FOR UPDATE USING (
    teacher_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all clearances" ON clearances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Clearance history policies
CREATE POLICY "Users can view clearance history" ON clearance_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM clearances c
      WHERE c.id = clearance_history.clearance_id
      AND (c.student_id = auth.uid() OR c.teacher_id = auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers and admins can insert history" ON clearance_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

-- System settings policies
CREATE POLICY "Everyone can view settings" ON system_settings
  FOR SELECT USING (true);

CREATE POLICY "Only admins can manage settings" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================
-- FUNCTIONS
-- ============================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clearances_updated_at BEFORE UPDATE ON clearances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create clearance history on status change
CREATE OR REPLACE FUNCTION create_clearance_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO clearance_history (clearance_id, previous_status, new_status, remarks, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.remarks, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clearance_status_change AFTER UPDATE ON clearances
  FOR EACH ROW EXECUTE FUNCTION create_clearance_history();

-- ============================
-- SEED DATA (Optional)
-- ============================

-- Insert default system settings
INSERT INTO system_settings (key, value) VALUES
  ('clearance_period_locked', '{"locked": false, "locked_at": null}'::jsonb),
  ('academic_year', '{"year": "2024-2025", "semester": "1st"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

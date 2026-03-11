-- ============================
-- SEED DATA FOR CLEARANCE MANAGEMENT SYSTEM
-- Run this AFTER running supabase-schema.sql
-- ============================

-- Note: You need to create auth users first through Supabase Dashboard
-- Then use their UUIDs here, OR use this script to create them

-- ============================
-- CREATE AUTH USERS AND PROFILES
-- ============================

-- Admin Users
DO $$
DECLARE
  admin1_id UUID;
  admin2_id UUID;
  teacher1_id UUID;
  teacher2_id UUID;
  student1_id UUID;
  student2_id UUID;
BEGIN
  -- Create Admin 1
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin1@school.edu',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO admin1_id;

  -- Create Admin 2
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin2@school.edu',
    crypt('admin123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO admin2_id;

  -- Create Teacher 1
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'teacher1@school.edu',
    crypt('teacher123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO teacher1_id;

  -- Create Teacher 2
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'teacher2@school.edu',
    crypt('teacher123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO teacher2_id;

  -- Create Student 1
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'student1@school.edu',
    crypt('student123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO student1_id;

  -- Create Student 2
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'student2@school.edu',
    crypt('student123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    ''
  ) RETURNING id INTO student2_id;

  -- Insert Admin Profiles
  INSERT INTO users (id, email, role, name, department, avatar) VALUES
    (admin1_id, 'admin1@school.edu', 'admin', 'Dr. Roberto Santos', 'Administration', 'RS'),
    (admin2_id, 'admin2@school.edu', 'admin', 'Ms. Elena Cruz', 'Registrar Office', 'EC');

  -- Insert Teacher Profiles
  INSERT INTO users (id, email, role, name, department, avatar) VALUES
    (teacher1_id, 'teacher1@school.edu', 'teacher', 'Prof. Maria Reyes', 'Computer Science', 'MR'),
    (teacher2_id, 'teacher2@school.edu', 'teacher', 'Prof. Juan Dela Cruz', 'Mathematics', 'JD');

  -- Insert Student Profiles
  INSERT INTO users (id, email, role, name, student_id, year_level, section, department, avatar) VALUES
    (student1_id, 'student1@school.edu', 'student', 'Anna Marie Santos', '2021-00001', 4, 'A', 'Computer Science', 'AS'),
    (student2_id, 'student2@school.edu', 'student', 'Carlos Miguel Garcia', '2021-00002', 4, 'B', 'Computer Science', 'CG');

  -- Insert Subjects
  INSERT INTO subjects (code, name, teacher_id, department) VALUES
    ('CS401', 'Software Engineering', teacher1_id, 'Computer Science'),
    ('CS402', 'Database Systems', teacher1_id, 'Computer Science'),
    ('MATH401', 'Advanced Calculus', teacher2_id, 'Mathematics'),
    ('MATH402', 'Linear Algebra', teacher2_id, 'Mathematics');

  -- Insert Clearances for Student 1
  INSERT INTO clearances (student_id, subject_id, teacher_id, status, remarks)
  SELECT 
    student1_id,
    s.id,
    s.teacher_id,
    CASE 
      WHEN s.code = 'CS401' THEN 'cleared'
      WHEN s.code = 'MATH401' THEN 'pending'
      ELSE 'pending'
    END,
    CASE 
      WHEN s.code = 'CS401' THEN 'All requirements submitted'
      ELSE 'Awaiting clearance'
    END
  FROM subjects s;

  -- Insert Clearances for Student 2
  INSERT INTO clearances (student_id, subject_id, teacher_id, status, remarks)
  SELECT 
    student2_id,
    s.id,
    s.teacher_id,
    'pending',
    'Awaiting clearance'
  FROM subjects s;

END $$;

-- ============================
-- DISPLAY CREATED ACCOUNTS
-- ============================

SELECT 
  '=== SAMPLE ACCOUNTS CREATED ===' as info;

SELECT 
  'ADMINS' as role,
  email,
  'admin123' as password,
  name
FROM users 
WHERE role = 'admin'
UNION ALL
SELECT 
  'TEACHERS' as role,
  email,
  'teacher123' as password,
  name
FROM users 
WHERE role = 'teacher'
UNION ALL
SELECT 
  'STUDENTS' as role,
  email,
  'student123' as password,
  name || ' (' || student_id || ')' as name
FROM users 
WHERE role = 'student'
ORDER BY role, email;

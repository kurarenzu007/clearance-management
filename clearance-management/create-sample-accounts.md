# Create Sample Accounts

Since Supabase auth.users table requires special handling, follow these steps:

## Step 1: Create Auth Users in Supabase Dashboard

1. Go to **Authentication** > **Users** in your Supabase dashboard
2. Click **Add User** for each account below:

### Admin Accounts
- **Email:** admin1@school.edu | **Password:** admin123
- **Email:** admin2@school.edu | **Password:** admin123

### Teacher Accounts
- **Email:** teacher1@school.edu | **Password:** teacher123
- **Email:** teacher2@school.edu | **Password:** teacher123

### Student Accounts
- **Email:** student1@school.edu | **Password:** student123
- **Email:** student2@school.edu | **Password:** student123

## Step 2: Run This SQL in SQL Editor

After creating the auth users above, run this SQL to create their profiles:

```sql
-- Get the auth user IDs
DO $$
DECLARE
  admin1_id UUID;
  admin2_id UUID;
  teacher1_id UUID;
  teacher2_id UUID;
  student1_id UUID;
  student2_id UUID;
BEGIN
  -- Get user IDs from auth.users
  SELECT id INTO admin1_id FROM auth.users WHERE email = 'admin1@school.edu';
  SELECT id INTO admin2_id FROM auth.users WHERE email = 'admin2@school.edu';
  SELECT id INTO teacher1_id FROM auth.users WHERE email = 'teacher1@school.edu';
  SELECT id INTO teacher2_id FROM auth.users WHERE email = 'teacher2@school.edu';
  SELECT id INTO student1_id FROM auth.users WHERE email = 'student1@school.edu';
  SELECT id INTO student2_id FROM auth.users WHERE email = 'student2@school.edu';

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
```

## Step 3: Verify Accounts

Run this query to see all created accounts:

```sql
SELECT 
  role,
  email,
  name,
  CASE 
    WHEN role = 'student' THEN student_id
    ELSE department
  END as info
FROM users 
ORDER BY role, email;
```

## Login Credentials Summary

| Role | Email | Password | Name |
|------|-------|----------|------|
| Admin | admin1@school.edu | admin123 | Dr. Roberto Santos |
| Admin | admin2@school.edu | admin123 | Ms. Elena Cruz |
| Teacher | teacher1@school.edu | teacher123 | Prof. Maria Reyes |
| Teacher | teacher2@school.edu | teacher123 | Prof. Juan Dela Cruz |
| Student | student1@school.edu | student123 | Anna Marie Santos (2021-00001) |
| Student | student2@school.edu | student123 | Carlos Miguel Garcia (2021-00002) |

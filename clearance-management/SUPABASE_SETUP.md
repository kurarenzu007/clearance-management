# Supabase Setup Guide

## Step 1: Install Dependencies

Run this command in your terminal:

```bash
cd clearance-management
npm install @supabase/supabase-js
```

## Step 2: Get Your Supabase Credentials

1. Go to your Supabase project: https://supabase.com/dashboard
2. Select your project: "clearance-management-system"
3. Go to **Settings** > **API**
4. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the `anon` key under "Project API keys")

## Step 3: Configure Environment Variables

1. Open the `.env` file in the `clearance-management` folder
2. Replace the placeholder values with your actual credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-actual-anon-key-here
```

## Step 4: Set Up Database Schema

1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql` file
5. Paste it into the SQL editor
6. Click **Run** to execute the schema

This will create:
- ✅ Users table
- ✅ Subjects table
- ✅ Clearances table
- ✅ Clearance history table
- ✅ System settings table
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for performance
- ✅ Triggers for automatic updates

## Step 5: Set Up Authentication

1. In Supabase dashboard, go to **Authentication** > **Providers**
2. Enable **Email** provider
3. Configure email templates (optional):
   - Go to **Authentication** > **Email Templates**
   - Customize confirmation and password reset emails

## Step 6: Create Initial Admin User

You have two options:

### Option A: Using Supabase Dashboard
1. Go to **Authentication** > **Users**
2. Click **Add User**
3. Enter email and password
4. After creating, go to **Table Editor** > **users**
5. Find the user and set `role` to `'admin'`

### Option B: Using SQL
1. Go to **SQL Editor**
2. Run this query (replace with your details):

```sql
-- First, create the auth user
-- This needs to be done through the dashboard or auth.users table

-- Then insert into users table
INSERT INTO users (id, email, role, name, avatar)
VALUES (
  'auth-user-uuid-here',  -- Get this from auth.users table
  'admin@example.com',
  'admin',
  'Admin User',
  'A'
);
```

## Step 7: Seed Sample Data (Optional)

Run this SQL to add sample data:

```sql
-- Insert sample teachers
INSERT INTO users (email, role, name, department, avatar) VALUES
  ('teacher1@school.edu', 'teacher', 'Prof. Maria Santos', 'Computer Science', 'MS'),
  ('teacher2@school.edu', 'teacher', 'Prof. Juan Dela Cruz', 'Mathematics', 'JD');

-- Insert sample students
INSERT INTO users (email, role, name, student_id, year_level, section, department, avatar) VALUES
  ('student1@school.edu', 'student', 'Anna Reyes', '2021-00001', 4, 'A', 'Computer Science', 'AR'),
  ('student2@school.edu', 'student', 'Carlos Garcia', '2021-00002', 4, 'B', 'Computer Science', 'CG');

-- Insert sample subjects
INSERT INTO subjects (code, name, teacher_id, department)
SELECT 'CS401', 'Software Engineering', id, 'Computer Science'
FROM users WHERE email = 'teacher1@school.edu'
UNION ALL
SELECT 'MATH401', 'Advanced Calculus', id, 'Mathematics'
FROM users WHERE email = 'teacher2@school.edu';

-- Insert sample clearances
INSERT INTO clearances (student_id, subject_id, teacher_id, status, remarks)
SELECT 
  s.id as student_id,
  sub.id as subject_id,
  sub.teacher_id,
  'pending' as status,
  'Awaiting clearance' as remarks
FROM users s
CROSS JOIN subjects sub
WHERE s.role = 'student';
```

## Step 8: Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Open the browser console (F12)
3. You should see no Supabase connection errors
4. Try logging in with your admin credentials

## Step 9: Update .gitignore

Make sure `.env` is in your `.gitignore` file to keep credentials secure:

```
.env
.env.local
```

## Troubleshooting

### Error: "Missing Supabase environment variables"
- Check that `.env` file exists in `clearance-management` folder
- Verify the variable names start with `VITE_`
- Restart the dev server after changing `.env`

### Error: "Invalid API key"
- Double-check you copied the `anon` key, not the `service_role` key
- Make sure there are no extra spaces in the `.env` file

### Error: "Row Level Security policy violation"
- Make sure you ran the entire `supabase-schema.sql` file
- Check that RLS policies were created in **Authentication** > **Policies**

### Can't log in
- Verify the user exists in **Authentication** > **Users**
- Check that the user has a corresponding entry in the `users` table
- Verify the `role` field is set correctly

## Next Steps

After setup is complete, you can:
1. Update the AuthContext to use real Supabase authentication
2. Replace mock data with real database queries
3. Test all CRUD operations
4. Set up real-time subscriptions for live updates

## Security Notes

- ⚠️ Never commit `.env` file to Git
- ⚠️ Never share your `service_role` key (only use `anon` key in frontend)
- ⚠️ Always use Row Level Security (RLS) policies
- ⚠️ Validate user roles on the backend

# AI Development Task: SCMS React/Supabase Integration & RLS Fixes

You are an expert full-stack developer specializing in React, Vite, Tailwind CSS, and Supabase (PostgreSQL, Auth, RLS). I am providing you with a codebase for a Student Clearance Management System (SCMS). 

The frontend design system and backend schema are largely in place, but they are not fully wired together, and there are critical Row Level Security (RLS) issues blocking data fetching.

Please execute the following tasks systematically. I have ordered them by priority. After completing each phase, briefly summarize the changes made.

## Phase 1: Critical RLS & Database Fixes
The primary blocker is that RLS policies are preventing cross-role data fetching (e.g., teachers cannot see student names). 

1.  **Refactor Admin Policies:** Replace the recursive subquery `EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')` used in all admin RLS policies. Create a `SECURITY DEFINER` helper function named `is_admin()` and update all relevant policies to use this function to prevent "infinite recursion" errors and improve performance.
2.  **Fix Join Visibility:** Update the `users` table SELECT policies. Currently, users can only see their own row or admins can see all. Add a policy allowing a user to view another user's row IF there is a linking `clearances` record (e.g., auth.uid() is the teacher, target row is the student) or a linking `subjects.teacher_id` record.
3.  **Secure Teacher Updates:** Update the teacher UPDATE policy for the `clearances` table. Add an explicit `WITH CHECK (teacher_id = auth.uid() OR is_admin())` clause.

## Phase 2: Wiring Dashboards & Removing Mocks
The UI components currently use hardcoded mock data. Wire them to the existing Supabase services.

1.  **Student Dashboard (`StudentDashboard.jsx`):** Replace `const MOCK_X = []` arrays with calls to `clearanceService`, `userService`, and `subjectService`. Ensure the UI renders the real fetched data.
2.  **Teacher Dashboard (`TeacherDashboard.jsx`):** 
    *   Replace mock data with real service calls.
    *   Wire the `updateStatus()` function to call `clearanceService.updateClearanceStatus()` instead of just mutating local state.
    *   Wire the `bulkApprove()` function to call `clearanceService.bulkUpdateClearances()`.
3.  **Admin Dashboard (`AdminDashboard.jsx`):**
    *   Replace mock data with real service calls.
    *   Wire the "Add Student" modal: connect form inputs to state and ensure the "Add Student" button calls `userService.createUser()`.
    *   Implement the `onClick` handler for the "+ Add Faculty" button (create a modal or action similar to adding a student).
    *   Implement handlers for the Table "View"/"Edit" (students) and "View"/"Assign" (faculty) buttons.
    *   Replace the static `ADMIN_STATS` object with real data derived from `clearanceService.getClearanceStats()` and a new department aggregation query.

## Phase 3: System Settings & Missing Handlers
1.  **System Settings Service:** Create a new file `settingsService.js` to handle CRUD operations for the `system_settings` table (specifically for `clearance_period_locked` and academic year config).
2.  **Admin Settings UI:** Wire the Admin period-lock toggle and Settings "Save Configuration" buttons to use the new `settingsService`.
3.  **Export Functions:** Implement functionality for the "Export PDF" buttons on report cards and the "Download PDF Certificate" button on the student Certificate tab.

## Phase 4: Code Quality & Polish
1.  **Login Component:** Remove or validate the Student/Faculty/Admin role tabs on the login page. (Validation: ensure the selected tab matches the fetched profile `role` post-login; if not, reject the login).
2.  **Service Optimization:** Refactor `clearanceService.getClearanceStats()`. Instead of fetching all rows and filtering client-side, implement a Postgres aggregate query (or RPC) for performance.
3.  **Data Scoping:** In `clearanceService.getStudentClearances` (and similar joins), restrict the `select()` on joined `users` rows to only necessary columns (e.g., `name, role, department`) rather than fetching the entire row.
4.  **Accessibility:** Add appropriate `aria-label` attributes to all icon-only buttons (e.g., action icons in `StudentTable`, topbar menu, notification bell).

**Important Directives:**
*   **Do not generate mock data.** Only use the provided Supabase service structure.
*   **Maintain existing styling.** Utilize the current Tailwind CSS patterns.
*   **Address all items strictly.** Do not skip any of the bullet points listed above.

Begin by confirming you understand these requirements, and then proceed with Phase 1.
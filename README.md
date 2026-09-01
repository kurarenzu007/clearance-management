# 🎓 SCMS — Student Clearance Management System

A full-stack web application for digitizing and automating student clearance workflows at STI. Students, faculty, and administrators manage clearances in real time — no paper, no queues.

**Stack:** React 19 + Vite · Supabase (PostgreSQL + Auth + RLS) · Recharts  
**Color Palette:** `#003DA5` (Blue) · `#FFD100` (Yellow) · `#FFFFFF` (White)  
**Live Demo:** [sti-clearance.vercel.app](https://sti-clearance.vercel.app)

---

## 📁 Project Structure

```
clearance-management/
├── public/
│   └── STI_LOGO.jpg
├── src/
│   ├── components/
│   │   └── common/
│   │       ├── Modal.jsx          # Reusable modal
│   │       ├── Sidebar.jsx        # Role-aware navigation sidebar
│   │       ├── StatusBadge.jsx    # Clearance status pill
│   │       └── Topbar.jsx         # Top navigation bar
│   ├── context/
│   │   └── AuthContext.jsx        # Global auth state (Supabase session)
│   ├── lib/
│   │   └── supabase.js            # Supabase client
│   ├── pages/
│   │   ├── AppShell.jsx           # Main layout wrapper + role routing
│   │   ├── LoginPage.jsx          # Login with role-tab validation
│   │   ├── admin/
│   │   │   └── AdminDashboard.jsx
│   │   ├── student/
│   │   │   └── StudentDashboard.jsx
│   │   └── teacher/
│   │       └── TeacherDashboard.jsx
│   ├── services/
│   │   ├── authService.js         # Supabase Auth wrapper
│   │   ├── clearanceService.js    # Clearances CRUD + stats RPC
│   │   ├── settingsService.js     # system_settings CRUD
│   │   ├── subjectService.js      # Subjects CRUD
│   │   └── userService.js         # Users CRUD
│   ├── styles/
│   │   ├── dashboard.css
│   │   ├── global.css
│   │   ├── layout.css
│   │   └── login.css
│   ├── App.jsx
│   └── main.jsx
├── supabase-schema.sql            # Full DB schema + RLS + triggers
├── supabase-rls-migration.sql     # RLS fix migration (run after schema)
├── supabase-seed-data.sql         # Sample accounts and clearance data
├── .env.example
├── vite.config.js
└── vercel.json
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/your-org/clearance-management.git
cd clearance-management
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and fill in your Supabase project values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Both values are found in your Supabase dashboard under **Project Settings → API**.

### 3. Set Up the Database

In your Supabase project, open the **SQL Editor** and run these files in order:

| Step | File | Purpose |
|------|------|---------|
| 1 | `supabase-schema.sql` | Creates all tables, indexes, RLS policies, and triggers |
| 2 | `supabase-rls-migration.sql` | Replaces recursive RLS policies with `is_admin()` helper + adds cross-role visibility |
| 3 | `supabase-seed-data.sql` | Creates sample auth users and profile rows |

### 4. Run the App

```bash
npm run dev
# → http://localhost:5173
```

---

## � Sample Login Credentials

These are created by `supabase-seed-data.sql`:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin1@school.edu` | `admin123` |
| Admin | `admin2@school.edu` | `admin123` |
| Teacher | `teacher1@school.edu` | `teacher123` |
| Teacher | `teacher2@school.edu` | `teacher123` |
| Student | `student1@school.edu` | `student123` |
| Student | `student2@school.edu` | `student123` |

> The login page validates that the selected role tab matches the account's actual role. Selecting the wrong tab will reject the login with an informative message.

---

## ✨ Features

### Student Portal
- Clearance progress overview with percentage bar
- Per-subject status cards (Cleared / Pending / Held / Rejected / Deficiency)
- Teacher remarks displayed per clearance item
- Filter clearances by status
- Download PDF clearance certificate when fully cleared (browser print dialog)

### Teacher Portal
- Dashboard overview of assigned students by status
- Approve, Hold, or Reject individual clearances with a remark
- Bulk approve multiple students at once
- Search and filter students by name, ID, or status
- All actions persist to Supabase in real time

### Admin Panel
- Live stats dashboard: total students, cleared, pending, rejected
- Bar chart (clearance by department) and donut chart (status breakdown)
- Clearance period lock/unlock toggle — persisted to `system_settings`
- Full student management: add, view, edit
- Full faculty management: add, view, assign subjects
- Department summary table with progress bars
- Export PDF reports (Cleared Students, Pending List, Deficiency Report, Full Summary)
- System settings: configure academic year, semester, start/end dates

---

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | All users (students, teachers, admins) with role, department, year level |
| `subjects` | Subjects linked to a teacher |
| `clearances` | Per-student-per-subject clearance record with status |
| `clearance_history` | Audit log of every status change |
| `system_settings` | Key-value store for app config (lock state, academic year) |

### Clearance Statuses

`pending` → `cleared` / `rejected` / `held` / `deficiency`

### RLS Summary

Row Level Security is enabled on all tables. Key policies:

- Users can read their own row; admins can read all rows
- Teachers can read student rows linked via `clearances`
- Students can read their teacher's row via `clearances`
- Teachers can only update clearances where `teacher_id = auth.uid()`
- All admin policies use the `is_admin()` SECURITY DEFINER function to prevent recursive query issues

### Server-Side RPC

`get_clearance_stats(p_user_id, p_role)` — returns aggregate status counts server-side (avoids fetching all rows client-side).

---

## 🎨 Design System

| Token | Value | Usage |
|-------|-------|-------|
| `--blue` | `#003DA5` | Primary brand, nav active state |
| `--yellow` | `#FFD100` | Accent, CTA buttons, highlights |
| `--green` | `#16a34a` | Cleared status |
| `--orange` | `#ea580c` | Held / on-hold status |
| `--red` | `#dc2626` | Rejected status |

**Fonts:** Plus Jakarta Sans (UI) · Space Mono (IDs, numbers, monospace)

---

## 🛠️ Scripts

```bash
npm run dev       # Start dev server (localhost:5173)
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # ESLint check
```

---

## 📦 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | 19 | UI framework |
| `@supabase/supabase-js` | 2 | Database, Auth, RLS client |
| `recharts` | 3 | Bar and pie charts |
| `react-router-dom` | 7 | Client-side routing |
| `react-hot-toast` | 2 | Toast notifications |
| `vite` | 7 | Build tool and dev server |

---

## 🚢 Deployment

The project includes a `vercel.json` configured for SPA routing. Deploy with:

```bash
npm run build
# then push to GitHub and import the repo in vercel.com
```

Make sure to add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Environment Variables in your Vercel project settings.

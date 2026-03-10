# 🎓 SCMS — Student Clearance Management System

A full-stack web application for digitizing and automating student clearance workflows.

**Color Palette:** `#003DA5` · `#FFD100` · `#FFFFFF`  
**Stack:** React + Vanilla CSS (Frontend) · Node.js/Express + PostgreSQL (Backend)

---

## 📁 Project Structure

```
scms/
├── frontend/                   # React app (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Sidebar, Topbar, Modal, StatusBadge
│   │   │   ├── student/
│   │   │   ├── teacher/
│   │   │   └── admin/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── AppShell.jsx    # Main layout wrapper
│   │   │   ├── student/        # StudentDashboard
│   │   │   ├── teacher/        # TeacherDashboard
│   │   │   └── admin/          # AdminDashboard
│   │   ├── styles/
│   │   │   ├── global.css      # Variables, resets, shared components
│   │   │   ├── layout.css      # Sidebar, topbar, main wrapper
│   │   │   ├── login.css       # Login page styles
│   │   │   └── dashboard.css   # Dashboard-specific styles
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Global auth state
│   │   └── utils/
│   │       └── mockData.js     # Demo data (replace with API calls)
│   └── package.json
│
└── backend/                    # Express REST API
    ├── src/
    │   ├── config/
    │   │   ├── db.js           # PostgreSQL pool
    │   │   └── schema.sql      # Database schema
    │   ├── controllers/
    │   │   ├── authController.js
    │   │   └── clearanceController.js
    │   ├── middleware/
    │   │   └── auth.js         # JWT auth + role guard
    │   ├── routes/
    │   │   └── index.js        # All API routes
    │   └── index.js            # Express server entry
    ├── .env.example
    └── package.json
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

**Demo Login Credentials:**
| Role    | ID              | Password  |
|---------|-----------------|-----------|
| Student | STU-2024-001    | demo123   |
| Faculty | FAC-2024-042    | demo123   |
| Admin   | ADM-2024-001    | demo123   |

---

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your PostgreSQL credentials

npm install
```

**Create the database:**
```bash
psql -U postgres -c "CREATE DATABASE scms_db;"
psql -U postgres -d scms_db -f src/config/schema.sql
```

**Start the API server:**
```bash
npm run dev
# → http://localhost:3001
```

---

## 🔐 API Endpoints

| Method | Endpoint                       | Role           | Description                    |
|--------|-------------------------------|----------------|--------------------------------|
| POST   | `/api/auth/login`             | All            | Login and get JWT token        |
| GET    | `/api/auth/me`                | All            | Get current user               |
| GET    | `/api/clearance/my`           | Student        | Get my clearance status        |
| GET    | `/api/clearance/students`     | Teacher/Admin  | Get students list              |
| PUT    | `/api/clearance/:id`          | Teacher/Admin  | Update clearance status        |
| PUT    | `/api/clearance/bulk`         | Teacher/Admin  | Bulk update statuses           |
| GET    | `/api/clearance/all`          | Admin          | Get all records (paginated)    |
| GET    | `/api/clearance/summary`      | Admin          | Get stats summary              |

---

## ✨ Features

### Student Portal
- Login with Student ID
- Real-time clearance progress overview
- View status per subject/teacher (Cleared / Pending / Held / Rejected)
- See teacher remarks and action items
- Download clearance certificate (PDF) when fully cleared

### Teacher Portal  
- View list of assigned students
- Approve / Reject / Hold clearance with remarks
- Bulk approve multiple students
- Filter and search by status
- Inline action buttons per student

### Admin Panel
- Statistics dashboard with bar + pie charts
- Manage students and faculty accounts
- Assign teachers to subjects
- Monitor clearance progress per department
- Generate reports (Cleared / Pending / Deficiency / Full Summary)
- Lock/Unlock clearance period per semester

---

## 🎨 Design System

| Token        | Value     | Usage                    |
|-------------|-----------|--------------------------|
| `--blue`    | `#003DA5` | Primary brand color      |
| `--yellow`  | `#FFD100` | Accent, highlights, CTA  |
| `--white`   | `#FFFFFF` | Backgrounds, text on dark|

Font pairing: **Plus Jakarta Sans** (UI) + **Space Mono** (code, numbers)
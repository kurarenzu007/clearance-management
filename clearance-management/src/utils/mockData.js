// Mock clearance data for student
export const MOCK_CLEARANCES = [
  {
    id: 1,
    subject: 'Data Structures & Algorithms',
    code: 'CS201',
    teacher: 'Prof. Juan Dela Cruz',
    status: 'cleared',
    remark: '',
    clearedAt: '2024-11-20',
  },
  {
    id: 2,
    subject: 'Database Management Systems',
    code: 'CS205',
    teacher: 'Prof. Ana Reyes',
    status: 'pending',
    remark: '',
    clearedAt: null,
  },
  {
    id: 3,
    subject: 'Computer Networks',
    code: 'CS210',
    teacher: 'Prof. Miguel Torres',
    status: 'held',
    remark: 'Missing laboratory report for Module 4. Please submit by end of week.',
    clearedAt: null,
  },
  {
    id: 4,
    subject: 'Operating Systems',
    code: 'CS215',
    teacher: 'Prof. Cris Fernandez',
    status: 'cleared',
    remark: '',
    clearedAt: '2024-11-18',
  },
  {
    id: 5,
    subject: 'Software Engineering',
    code: 'CS220',
    teacher: 'Prof. Lisa Gomez',
    status: 'rejected',
    remark: 'Incomplete requirement: Missing final project documentation and demo video.',
    clearedAt: null,
  },
  {
    id: 6,
    subject: 'Library',
    code: 'LIBRARY',
    teacher: 'Librarian Santos',
    status: 'pending',
    remark: 'Please return borrowed books before clearance.',
    clearedAt: null,
  },
  {
    id: 7,
    subject: 'Accounting / Finance',
    code: 'FINANCE',
    teacher: 'Cashier Office',
    status: 'cleared',
    remark: '',
    clearedAt: '2024-11-15',
  },
  {
    id: 8,
    subject: 'Guidance Office',
    code: 'GUIDANCE',
    teacher: 'Counselor Rivera',
    status: 'cleared',
    remark: '',
    clearedAt: '2024-11-14',
  },
];

// Mock students for teacher dashboard
export const MOCK_STUDENTS = [
  { id: 'STU-001', name: 'Maria Santos', course: 'BS CS', year: '3rd', status: 'pending', remark: '' },
  { id: 'STU-002', name: 'Jose Rizal', course: 'BS CS', year: '3rd', status: 'cleared', remark: '' },
  { id: 'STU-003', name: 'Ana Reyes', course: 'BS IT', year: '3rd', status: 'held', remark: 'Missing lab report' },
  { id: 'STU-004', name: 'Pedro Cruz', course: 'BS CS', year: '3rd', status: 'pending', remark: '' },
  { id: 'STU-005', name: 'Liza Gomez', course: 'BS IT', year: '3rd', status: 'rejected', remark: 'No submission for final project' },
  { id: 'STU-006', name: 'Carlos Mendoza', course: 'BS CS', year: '3rd', status: 'cleared', remark: '' },
  { id: 'STU-007', name: 'Sofia Tan', course: 'BS IT', year: '3rd', status: 'pending', remark: '' },
  { id: 'STU-008', name: 'Miguel Torres', course: 'BS CS', year: '3rd', status: 'held', remark: 'Incomplete attendance' },
  { id: 'STU-009', name: 'Grace Park', course: 'BS IT', year: '3rd', status: 'cleared', remark: '' },
  { id: 'STU-010', name: 'Ramon Aquino', course: 'BS CS', year: '3rd', status: 'pending', remark: '' },
  { id: 'STU-011', name: 'Iris Dela Rosa', course: 'BS IT', year: '3rd', status: 'cleared', remark: '' },
  { id: 'STU-012', name: 'Ben Santos', course: 'BS CS', year: '3rd', status: 'rejected', remark: 'Failed to meet requirements' },
];

// Mock users for admin
export const MOCK_ALL_STUDENTS = [
  ...MOCK_STUDENTS,
  { id: 'STU-013', name: 'Laura Cruz', course: 'BS EE', year: '4th', status: 'cleared', remark: '' },
  { id: 'STU-014', name: 'James Lee', course: 'BS ME', year: '2nd', status: 'pending', remark: '' },
];

export const MOCK_TEACHERS = [
  { id: 'FAC-001', name: 'Prof. Juan Dela Cruz', department: 'Engineering', subjects: ['CS201', 'CS301'], students: 45 },
  { id: 'FAC-002', name: 'Prof. Ana Reyes', department: 'Engineering', subjects: ['CS205'], students: 38 },
  { id: 'FAC-003', name: 'Prof. Miguel Torres', department: 'Engineering', subjects: ['CS210'], students: 42 },
  { id: 'FAC-004', name: 'Prof. Cris Fernandez', department: 'Engineering', subjects: ['CS215'], students: 50 },
  { id: 'FAC-005', name: 'Prof. Lisa Gomez', department: 'IT', subjects: ['CS220', 'CS110'], students: 35 },
  { id: 'FAC-006', name: 'Librarian Santos', department: 'Library', subjects: ['LIBRARY'], students: 250 },
];

// Admin stats
export const ADMIN_STATS = {
  totalStudents: 1248,
  cleared: 742,
  pending: 389,
  rejected: 67,
  held: 50,
  departments: [
    { name: 'Engineering', cleared: 310, total: 420 },
    { name: 'Business', cleared: 198, total: 280 },
    { name: 'Arts & Sciences', cleared: 142, total: 210 },
    { name: 'Nursing', cleared: 92, total: 118 },
    { name: 'Architecture', cleared: 0, total: 220 },
  ],
};

export const CLEARANCE_PERIOD = {
  semester: '1st Semester',
  academicYear: '2024-2025',
  startDate: '2024-11-01',
  endDate: '2024-11-30',
  isLocked: false,
};
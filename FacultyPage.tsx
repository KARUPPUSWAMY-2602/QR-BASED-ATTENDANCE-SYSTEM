import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import FacultyPage from './pages/admin/FacultyPage';
import SubjectsPage from './pages/admin/SubjectsPage';
import AdminAttendancePage from './pages/admin/AttendancePage';
import AdminReportsPage from './pages/admin/ReportsPage';
import SettingsPage from './pages/admin/SettingsPage';

// Faculty pages
import FacultyDashboard from './pages/faculty/Dashboard';
import FacultyStudentsPage from './pages/faculty/StudentsPage';
import GenerateQR from './pages/faculty/GenerateQR';
import FacultyAttendancePage from './pages/faculty/AttendancePage';
import FacultyReportsPage from './pages/faculty/ReportsPage';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import ScanQR from './pages/student/ScanQR';
import MyAttendance from './pages/student/MyAttendance';

// Shared
import ProfilePage from './pages/ProfilePage';

const pageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  students: 'Students',
  faculty: 'Faculty',
  subjects: 'Subjects',
  attendance: 'Attendance',
  reports: 'Reports',
  settings: 'Settings',
  profile: 'My Profile',
  'generate-qr': 'Generate QR Code',
  'scan-qr': 'Scan QR Code',
  'my-attendance': 'My Attendance',
};

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return <Login />;
  }

  function renderPage() {
    if (currentPage === 'profile') return <ProfilePage />;

    if (profile?.role === 'admin') {
      switch (currentPage) {
        case 'faculty': return <FacultyPage />;
        case 'subjects': return <SubjectsPage />;
        case 'attendance': return <AdminAttendancePage />;
        case 'reports': return <AdminReportsPage />;
        case 'settings': return <SettingsPage />;
        default: return <AdminDashboard />;
      }
    }

    if (profile?.role === 'faculty') {
      switch (currentPage) {
        case 'students': return <FacultyStudentsPage />;
        case 'generate-qr': return <GenerateQR />;
        case 'attendance': return <FacultyAttendancePage />;
        case 'reports': return <FacultyReportsPage />;
        default: return <FacultyDashboard onNavigate={setCurrentPage} />;
      }
    }

    if (profile?.role === 'student') {
      switch (currentPage) {
        case 'scan-qr': return <ScanQR />;
        case 'my-attendance': return <MyAttendance />;
        default: return <StudentDashboard onNavigate={setCurrentPage} />;
      }
    }

    return <div className="text-slate-500 text-sm">Unknown role</div>;
  }

  const title = pageTitles[currentPage] ?? 'Dashboard';

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage} pageTitle={title}>
      {renderPage()}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

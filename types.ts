import { useState } from 'react';
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, ClipboardList,
  BarChart3, Settings, LogOut, QrCode, ScanLine, User, ChevronLeft, ChevronRight, CalendarCheck
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface NavItem {
  label: string;
  icon: React.ElementType;
  page: string;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { label: 'Faculty', icon: Users, page: 'faculty' },
  { label: 'Subjects', icon: BookOpen, page: 'subjects' },
  { label: 'Attendance', icon: CalendarCheck, page: 'attendance' },
  { label: 'Reports', icon: BarChart3, page: 'reports' },
  { label: 'Settings', icon: Settings, page: 'settings' },
];

const facultyNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { label: 'Students', icon: GraduationCap, page: 'students' },
  { label: 'Generate QR', icon: QrCode, page: 'generate-qr' },
  { label: 'Attendance', icon: ClipboardList, page: 'attendance' },
  { label: 'Reports', icon: BarChart3, page: 'reports' },
];

const studentNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, page: 'dashboard' },
  { label: 'Scan QR', icon: ScanLine, page: 'scan-qr' },
  { label: 'My Attendance', icon: ClipboardList, page: 'my-attendance' },
];

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems =
    profile?.role === 'admin' ? adminNav :
    profile?.role === 'faculty' ? facultyNav :
    studentNav;

  const roleLabel =
    profile?.role === 'admin' ? 'Administrator' :
    profile?.role === 'faculty' ? 'Faculty' : 'Student';

  const roleColor =
    profile?.role === 'admin' ? 'bg-amber-500' :
    profile?.role === 'faculty' ? 'bg-emerald-500' : 'bg-blue-500';

  return (
    <aside
      className={`relative flex flex-col bg-slate-900 text-white transition-all duration-300 shrink-0 ${
        collapsed ? 'w-[68px]' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700 ${collapsed ? 'justify-center px-2' : ''}`}>
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600 shrink-0">
          <QrCode size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <p className="text-sm font-bold leading-tight">QR Attendance</p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{roleLabel}</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navItems.map(({ label, icon: Icon, page }) => {
          const active = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              title={collapsed ? label : undefined}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors relative group ${
                collapsed ? 'justify-center px-2' : ''
              } ${
                active
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {active && <span className="absolute left-0 inset-y-0 w-0.5 bg-blue-400 rounded-r" />}
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-50 transition-opacity">
                  {label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-slate-700 py-3 space-y-0.5">
        <button
          onClick={() => onNavigate('profile')}
          title={collapsed ? 'Profile' : undefined}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors group relative ${
            collapsed ? 'justify-center px-2' : ''
          } ${currentPage === 'profile' ? 'bg-blue-600 text-white' : ''}`}
        >
          <User size={18} className="shrink-0" />
          {!collapsed && 'Profile'}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-50 transition-opacity">
              Profile
            </span>
          )}
        </button>
        <button
          onClick={signOut}
          title={collapsed ? 'Logout' : undefined}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-red-600 hover:text-white transition-colors group relative ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Logout'}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 bg-slate-700 text-white text-xs rounded opacity-0 pointer-events-none group-hover:opacity-100 whitespace-nowrap z-50 transition-opacity">
              Logout
            </span>
          )}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 hover:bg-blue-600 border border-slate-600 rounded-full flex items-center justify-center text-white transition-colors z-10 shadow"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pb-3">
          <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium text-white ${roleColor}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/70" />
            {roleLabel}
          </div>
        </div>
      )}
    </aside>
  );
}

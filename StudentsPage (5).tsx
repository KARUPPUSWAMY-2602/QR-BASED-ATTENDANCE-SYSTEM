import { useEffect, useState } from 'react';
import { ScanLine, ClipboardList, TrendingUp, BookOpen, CalendarCheck, Award } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import type { Student } from '../../lib/types';

interface StudentDashboardProps {
  onNavigate: (page: string) => void;
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { profile } = useAuth();
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [stats, setStats] = useState({ present: 0, absent: 0, total: 0 });
  const [recentSubjects, setRecentSubjects] = useState<{ name: string; present: number; total: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    async function load() {
      const [stuRes, attRes] = await Promise.all([
        supabase.from('students').select('*').eq('id', profile!.id).maybeSingle(),
        supabase.from('attendance_records').select('status, qr_sessions(subjects(subject_name))').eq('student_id', profile!.id),
      ]);
      setStudentData(stuRes.data ?? null);

      const records = (attRes.data ?? []) as any[];
      let present = 0, absent = 0;
      const subMap = new Map<string, { present: number; total: number }>();

      for (const r of records) {
        if (r.status === 'present') present++; else absent++;
        const subName = r.qr_sessions?.subjects?.subject_name ?? 'Unknown';
        if (!subMap.has(subName)) subMap.set(subName, { present: 0, total: 0 });
        const s = subMap.get(subName)!;
        s.total++;
        if (r.status === 'present') s.present++;
      }

      setStats({ present, absent, total: records.length });
      setRecentSubjects(Array.from(subMap.entries()).map(([name, s]) => ({ name, ...s })).slice(0, 5));
      setLoading(false);
    }
    load();
  }, [profile]);

  const percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const initials = profile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div className="space-y-6">
      {/* Profile banner */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 rounded-2xl p-6 text-white shadow-lg flex items-center gap-5">
        <div className="shrink-0">
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-blue-400" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-2xl font-bold border-2 border-blue-400">
              {initials}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-blue-200 text-sm">Welcome back,</p>
          <h2 className="text-xl font-bold truncate">{profile?.full_name}</h2>
          {studentData && (
            <div className="flex flex-wrap gap-3 mt-2">
              <span className="text-xs bg-blue-600/50 px-2 py-0.5 rounded-full">{studentData.reg_no}</span>
              <span className="text-xs bg-blue-600/50 px-2 py-0.5 rounded-full">{studentData.course}</span>
              <span className="text-xs bg-blue-600/50 px-2 py-0.5 rounded-full">Sem {studentData.semester}</span>
              <span className="text-xs bg-blue-600/50 px-2 py-0.5 rounded-full">Sec {studentData.section}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Attendance Summary */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col items-center">
          <h3 className="font-semibold text-slate-800 mb-4 self-start text-sm">Attendance Summary</h3>
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.2" />
              <circle cx="18" cy="18" r="15.9" fill="none"
                stroke={percentage >= 75 ? '#22c55e' : percentage >= 60 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3.2"
                strokeDasharray={`${percentage} 100`}
                strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-slate-900">{percentage}%</span>
              <span className="text-xs text-slate-500">Attendance</span>
            </div>
          </div>
          <div className="w-full mt-5 space-y-2">
            {[
              { label: 'Present Days', value: stats.present, color: 'text-emerald-600', dot: 'bg-emerald-500' },
              { label: 'Absent Days', value: stats.absent, color: 'text-red-500', dot: 'bg-red-500' },
              { label: 'Total Classes', value: stats.total, color: 'text-slate-700', dot: 'bg-slate-400' },
            ].map(({ label, value, color, dot }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${dot}`} />
                  <span className="text-slate-600">{label}</span>
                </div>
                <span className={`font-bold ${color}`}>{value}</span>
              </div>
            ))}
          </div>
          {percentage < 75 && stats.total > 0 && (
            <div className="mt-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-lg p-2 w-full text-center">
              ⚠ Attendance below 75% threshold
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Quick Actions</h3>
          <button
            onClick={() => onNavigate('scan-qr')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-5 flex items-center gap-4 transition-all hover:shadow-lg group"
          >
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <ScanLine size={24} />
            </div>
            <div className="text-left">
              <p className="font-semibold">Scan QR Code</p>
              <p className="text-blue-200 text-xs mt-0.5">Click to scan QR and mark attendance</p>
            </div>
          </button>
          <button
            onClick={() => onNavigate('my-attendance')}
            className="w-full bg-white hover:shadow-md border border-slate-100 rounded-xl p-4 flex items-center gap-3 transition-all"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ClipboardList size={18} className="text-emerald-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-slate-800">View Attendance History</p>
              <p className="text-xs text-slate-500 mt-0.5">See detailed attendance records</p>
            </div>
          </button>
        </div>

        {/* Subject-wise breakdown */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm flex items-center gap-2">
            <BookOpen size={16} className="text-violet-600" />
            Subject-wise Attendance
          </h3>
          {loading ? (
            <div className="text-slate-400 text-sm text-center py-8">Loading...</div>
          ) : recentSubjects.length === 0 ? (
            <div className="text-slate-400 text-sm text-center py-8">No data yet</div>
          ) : (
            <div className="space-y-3">
              {recentSubjects.map(sub => {
                const pct = sub.total > 0 ? Math.round((sub.present / sub.total) * 100) : 0;
                return (
                  <div key={sub.name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-700 font-medium truncate max-w-[70%]">{sub.name}</span>
                      <span className={`font-bold ${pct >= 75 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{pct}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 75 ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{sub.present}/{sub.total} classes</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { GraduationCap, Users, CalendarCheck, BarChart3, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Stats {
  totalStudents: number;
  totalFaculty: number;
  attendanceToday: number;
  totalSubjects: number;
}

interface Activity { id: string; label: string; time: string; type: 'qr' | 'attend' | 'report'; }

function StatCard({ icon: Icon, label, value, color, trend }: {
  icon: React.ElementType; label: string; value: number | string; color: string; trend?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex items-start gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
        {trend && <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1"><TrendingUp size={12} />{trend}</p>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalStudents: 0, totalFaculty: 0, attendanceToday: 0, totalSubjects: 0 });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [weekData, setWeekData] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];
      const [studRes, facRes, attendRes, subRes, actRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('faculty').select('id', { count: 'exact', head: true }),
        supabase.from('attendance_records').select('id', { count: 'exact', head: true })
          .gte('marked_at', today + 'T00:00:00').lte('marked_at', today + 'T23:59:59'),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('qr_sessions').select('id, generated_at, subjects(subject_name)').order('generated_at', { ascending: false }).limit(5),
      ]);

      setStats({
        totalStudents: studRes.count ?? 0,
        totalFaculty: facRes.count ?? 0,
        attendanceToday: attendRes.count ?? 0,
        totalSubjects: subRes.count ?? 0,
      });

      if (actRes.data) {
        setRecentActivity(actRes.data.map((s: any) => ({
          id: s.id,
          label: `QR Generated – ${s.subjects?.subject_name ?? 'Unknown'}`,
          time: new Date(s.generated_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          type: 'qr' as const,
        })));
      }

      // Generate week data
      const days = ['Mon','Tue','Wed','Thu','Fri','Sat'];
      const now = new Date();
      const week: { day: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const res = await supabase.from('attendance_records')
          .select('id', { count: 'exact', head: true })
          .gte('marked_at', dayStr + 'T00:00:00')
          .lte('marked_at', dayStr + 'T23:59:59');
        week.push({ day: days[5 - i] || days[d.getDay() - 1], count: res.count ?? 0 });
      }
      setWeekData(week);
      setLoading(false);
    }
    load();
  }, []);

  const maxCount = Math.max(...weekData.map(d => d.count), 1);

  const typeColors: Record<Activity['type'], string> = {
    qr: 'bg-blue-100 text-blue-700',
    attend: 'bg-emerald-100 text-emerald-700',
    report: 'bg-violet-100 text-violet-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Welcome back, {profile?.full_name?.split(' ')[0]} 👋</h2>
        <p className="text-slate-500 text-sm mt-0.5">Here's what's happening in your institution today.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={GraduationCap} label="Total Students" value={stats.totalStudents} color="bg-blue-600" trend="+3 this week" />
        <StatCard icon={Users} label="Total Faculty" value={stats.totalFaculty} color="bg-emerald-600" />
        <StatCard icon={CalendarCheck} label="Attendance Today" value={stats.attendanceToday} color="bg-amber-500" />
        <StatCard icon={BarChart3} label="Total Subjects" value={stats.totalSubjects} color="bg-rose-500" />
      </div>

      {/* Charts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Bar chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-slate-800">Attendance Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Last 6 days</p>
            </div>
            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-full">This Week</span>
          </div>
          {loading ? (
            <div className="h-44 flex items-center justify-center text-slate-400 text-sm">Loading...</div>
          ) : (
            <div className="flex items-end gap-3 h-44">
              {weekData.map(({ day, count }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-600">{count}</span>
                  <div
                    className="w-full rounded-t-md bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
                    style={{ height: `${maxCount ? (count / maxCount) * 148 : 4}px`, minHeight: 4 }}
                    title={`${count} records`}
                  />
                  <span className="text-xs text-slate-500">{day}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Attendance Donut */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-semibold text-slate-800 mb-1">Attendance Summary</h3>
          <p className="text-xs text-slate-500 mb-5">Today's breakdown</p>
          <div className="flex flex-col items-center">
            <div className="relative w-28 h-28">
              <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3.2" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3.2"
                  strokeDasharray={`${Math.min(stats.totalStudents ? (stats.attendanceToday / stats.totalStudents) * 100 : 0, 100)} 100`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-slate-900">
                  {stats.totalStudents ? Math.round((stats.attendanceToday / stats.totalStudents) * 100) : 0}%
                </span>
                <span className="text-xs text-slate-500">Present</span>
              </div>
            </div>
            <div className="mt-5 w-full space-y-2">
              {[
                { label: 'Present', count: stats.attendanceToday, color: 'bg-emerald-500' },
                { label: 'Total Students', count: stats.totalStudents, color: 'bg-blue-500' },
              ].map(({ label, count, color }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
                    <span className="text-slate-600">{label}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-slate-600" />
          <h3 className="font-semibold text-slate-800">Recent Activity</h3>
        </div>
        {recentActivity.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-8">No recent activity</p>
        ) : (
          <div className="space-y-3">
            {recentActivity.map(act => (
              <div key={act.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColors[act.type]}`}>
                    {act.type === 'qr' ? 'QR' : act.type === 'attend' ? 'ATT' : 'RPT'}
                  </span>
                  <span className="text-sm text-slate-700">{act.label}</span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">{act.time}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { CalendarCheck, Clock, BookOpen, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SessionRow {
  id: string;
  generated_at: string;
  expires_at: string;
  is_active: boolean;
  subject_name: string;
  faculty_name: string;
  count: number;
}

export default function AttendancePage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('qr_sessions')
        .select('id, generated_at, expires_at, is_active, subjects(subject_name), profiles(full_name)')
        .order('generated_at', { ascending: false })
        .limit(50);
      if (!data) { setLoading(false); return; }

      const withCounts = await Promise.all((data as any[]).map(async s => {
        const { count } = await supabase
          .from('attendance_records')
          .select('id', { count: 'exact', head: true })
          .eq('session_id', s.id);
        return {
          id: s.id,
          generated_at: s.generated_at,
          expires_at: s.expires_at,
          is_active: s.is_active,
          subject_name: s.subjects?.subject_name ?? '—',
          faculty_name: s.profiles?.full_name ?? '—',
          count: count ?? 0,
        };
      }));
      setSessions(withCounts);
      setLoading(false);
    }
    load();
  }, []);

  const fmt = (d: string) => new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-800">QR Sessions</h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{sessions.length} sessions</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <CalendarCheck size={40} className="mb-3 opacity-40" />
            <p className="text-sm">No QR sessions yet. Faculty will generate QR codes to take attendance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {['Subject','Faculty','Generated','Expires','Attendance','Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {sessions.map(s => {
                  const expired = new Date(s.expires_at) < new Date();
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <BookOpen size={14} className="text-violet-500" />
                          <span className="font-medium text-slate-800">{s.subject_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-slate-400" />
                          <span className="text-slate-700">{s.faculty_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-slate-400" />
                          {fmt(s.generated_at)}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{fmt(s.expires_at)}</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-800">{s.count}</span>
                        <span className="text-slate-400 text-xs ml-1">marked</span>
                      </td>
                      <td className="px-4 py-3">
                        {expired || !s.is_active ? (
                          <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Expired</span>
                        ) : (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full animate-pulse">Active</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

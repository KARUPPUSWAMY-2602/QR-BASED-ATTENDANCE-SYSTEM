import { useEffect, useState } from 'react';
import { Search, Download, BarChart3, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Subject } from '../../lib/types';

interface ReportRow {
  student_id: string;
  reg_no: string;
  name: string;
  present: number;
  absent: number;
  total: number;
  percentage: number;
}

export default function ReportsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    supabase.from('subjects').select('id, subject_code, subject_name').order('subject_name').then(({ data }) => {
      setSubjects((data ?? []) as Subject[]);
    });
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setFromDate(start.toISOString().split('T')[0]);
    setToDate(now.toISOString().split('T')[0]);
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setSearched(true);

    let query = supabase
      .from('attendance_records')
      .select('student_id, status, students(reg_no, profiles(full_name)), qr_sessions(subject_id)')
      .gte('marked_at', fromDate + 'T00:00:00')
      .lte('marked_at', toDate + 'T23:59:59');

    if (selectedSubject) {
      const { data: sessions } = await supabase
        .from('qr_sessions')
        .select('id')
        .eq('subject_id', selectedSubject);
      const ids = (sessions ?? []).map(s => s.id);
      if (ids.length) query = query.in('session_id', ids);
    }

    const { data } = await query;
    if (!data) { setRows([]); setLoading(false); return; }

    const map = new Map<string, ReportRow>();
    for (const r of data as any[]) {
      const sid = r.student_id;
      if (!map.has(sid)) {
        map.set(sid, {
          student_id: sid,
          reg_no: r.students?.reg_no ?? '—',
          name: r.students?.profiles?.full_name ?? '—',
          present: 0, absent: 0, total: 0, percentage: 0,
        });
      }
      const row = map.get(sid)!;
      row.total++;
      if (r.status === 'present') row.present++;
      else if (r.status === 'absent') row.absent++;
    }

    const result = Array.from(map.values()).map(r => ({
      ...r,
      percentage: r.total > 0 ? Math.round((r.present / r.total) * 100) : 0,
    }));
    result.sort((a, b) => b.percentage - a.percentage);
    setRows(result);
    setLoading(false);
  }

  function statusBadge(pct: number) {
    if (pct >= 75) return { label: 'Good', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 };
    if (pct >= 60) return { label: 'Average', cls: 'bg-amber-100 text-amber-700', icon: MinusCircle };
    return { label: 'Poor', cls: 'bg-red-100 text-red-700', icon: XCircle };
  }

  function downloadCSV() {
    const header = 'Reg No,Name,Present,Absent,Total,Percentage,Status\n';
    const body = rows.map(r => `${r.reg_no},${r.name},${r.present},${r.absent},${r.total},${r.percentage}%,${statusBadge(r.percentage).label}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'attendance_report.csv'; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* Filter form */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-100">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <BarChart3 size={18} className="text-blue-600" />
          Attendance Report
        </h3>
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-40">
            <label className="block text-xs text-slate-500 mb-1.5">Subject</label>
            <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Subjects</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.subject_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1.5">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <button type="submit" disabled={loading} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
            <Search size={15} />Search
          </button>
          {rows.length > 0 && (
            <button type="button" onClick={downloadCSV} className="flex items-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <Download size={15} />Export CSV
            </button>
          )}
        </form>
      </div>

      {/* Results */}
      {searched && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Results</span>
            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
              {loading ? 'Loading...' : `${rows.length} students`}
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Generating report...</div>
          ) : rows.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-sm">No attendance records found for the selected filters</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Reg No','Student Name','Present','Absent','Total','Percentage','Status'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rows.map(row => {
                    const { label, cls, icon: Icon } = statusBadge(row.percentage);
                    return (
                      <tr key={row.student_id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-700">{row.reg_no}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">{row.name}</td>
                        <td className="px-4 py-3 text-emerald-600 font-medium">{row.present}</td>
                        <td className="px-4 py-3 text-red-500 font-medium">{row.absent}</td>
                        <td className="px-4 py-3 text-slate-600">{row.total}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${row.percentage >= 75 ? 'bg-emerald-500' : row.percentage >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${row.percentage}%` }} />
                            </div>
                            <span className="font-semibold text-slate-700">{row.percentage}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>
                            <Icon size={11} />{label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-400 flex justify-between">
                <span>Total Students: {rows.length}</span>
                <span>Report Generated: {new Date().toLocaleDateString('en-IN')}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

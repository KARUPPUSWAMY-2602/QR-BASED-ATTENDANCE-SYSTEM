import { useEffect, useState } from 'react';
import { Search, Plus, X, AlertCircle, CheckCircle, GraduationCap } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Student } from '../../lib/types';

interface NewStudentForm {
  full_name: string; email: string; password: string; phone: string;
  reg_no: string; course: string; section: string; semester: string; department: string;
}

const emptyForm: NewStudentForm = {
  full_name: '', email: '', password: '', phone: '',
  reg_no: '', course: '', section: '', semester: '1', department: '',
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<NewStudentForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function fetchStudents() {
    setLoading(true);
    const { data } = await supabase
      .from('students')
      .select('*, profiles(full_name, photo_url, phone, email:id)')
      .order('reg_no');
    setStudents((data ?? []) as unknown as Student[]);
    setLoading(false);
  }

  useEffect(() => { fetchStudents(); }, []);

  const filtered = students.filter(s => {
    const name = (s.profiles?.full_name ?? '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || s.reg_no.toLowerCase().includes(q) || s.course.toLowerCase().includes(q);
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: 'student',
          phone: form.phone || null,
          student_data: {
            reg_no: form.reg_no,
            course: form.course,
            section: form.section,
            semester: parseInt(form.semester),
            department: form.department,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to create student');
      setMsg({ type: 'success', text: 'Student account created successfully!' });
      setForm(emptyForm);
      setShowModal(false);
      fetchStudents();
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  const semesterLabel = (s: number) => {
    const suf = ['th','st','nd','rd'];
    const v = s % 100;
    return s + (suf[(v - 20) % 10] ?? suf[v] ?? suf[0]) + ' Sem';
  };

  return (
    <div className="space-y-5">
      {msg && (
        <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm border ${
          msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
          <button onClick={() => setMsg(null)} className="ml-auto"><X size={14} /></button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search students..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />
          Add Student
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-800">All Students</h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} records</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading students...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <GraduationCap size={40} className="mb-3 opacity-40" />
            <p className="text-sm">{search ? 'No students match your search' : 'No students yet. Add your first student!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Reg No</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Section</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Semester</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(student => {
                  const initials = (student.profiles?.full_name ?? 'S').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {student.profiles?.photo_url ? (
                            <img src={student.profiles.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                              {initials}
                            </div>
                          )}
                          <span className="font-medium text-slate-800">{student.profiles?.full_name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">{student.reg_no}</td>
                      <td className="px-4 py-3.5 text-slate-700">{student.course}</td>
                      <td className="px-4 py-3.5 text-slate-700">{student.section}</td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {semesterLabel(student.semester)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{student.department}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add New Student</h2>
              <button onClick={() => { setShowModal(false); setMsg(null); }} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Account Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-600 mb-1.5">Full Name *</label>
                  <input required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Student full name" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="student@email.com" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Password *</label>
                  <input required type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min. 6 characters" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-600 mb-1.5">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                </div>
              </div>

              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-1 border-t border-slate-100">Student Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Reg. No *</label>
                  <input required value={form.reg_no} onChange={e => setForm(f => ({...f, reg_no: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="23CS101" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Semester *</label>
                  <select value={form.semester} onChange={e => setForm(f => ({...f, semester: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Course *</label>
                  <input required value={form.course} onChange={e => setForm(f => ({...f, course: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="B.Sc CS" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Section *</label>
                  <input required value={form.section} onChange={e => setForm(f => ({...f, section: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="A" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-600 mb-1.5">Department *</label>
                  <input required value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Computer Science" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

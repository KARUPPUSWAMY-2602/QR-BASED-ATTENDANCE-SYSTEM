import { useEffect, useState } from 'react';
import { Search, Plus, X, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Subject, Faculty } from '../../lib/types';

interface SubjectForm {
  subject_code: string; subject_name: string; faculty_id: string;
  section: string; semester: string; department: string;
}

const emptyForm: SubjectForm = { subject_code: '', subject_name: '', faculty_id: '', section: '', semester: '1', department: '' };

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<SubjectForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function fetchData() {
    setLoading(true);
    const [subRes, facRes] = await Promise.all([
      supabase.from('subjects').select('*, faculty(employee_id, profiles(full_name))').order('subject_code'),
      supabase.from('faculty').select('*, profiles(full_name)').order('employee_id'),
    ]);
    setSubjects((subRes.data ?? []) as unknown as Subject[]);
    setFacultyList((facRes.data ?? []) as unknown as Faculty[]);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  const filtered = subjects.filter(s => {
    const q = search.toLowerCase();
    return s.subject_name.toLowerCase().includes(q) || s.subject_code.toLowerCase().includes(q) || s.department.toLowerCase().includes(q);
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const { error } = await supabase.from('subjects').insert({
      subject_code: form.subject_code,
      subject_name: form.subject_name,
      faculty_id: form.faculty_id || null,
      section: form.section,
      semester: parseInt(form.semester),
      department: form.department,
    });
    setSaving(false);
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: 'Subject created successfully!' });
      setForm(emptyForm);
      setShowModal(false);
      fetchData();
    }
  }

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

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search subjects..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          <Plus size={16} />Add Subject
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} className="text-violet-600" />
            <h3 className="font-semibold text-slate-800">All Subjects</h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} subjects</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading subjects...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <BookOpen size={40} className="mb-3 opacity-40" />
            <p className="text-sm">{search ? 'No subjects match your search' : 'No subjects yet. Add your first subject!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Code</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Subject Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Faculty</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sem/Section</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(sub => (
                  <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-mono font-medium text-blue-700">{sub.subject_code}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{sub.subject_name}</td>
                    <td className="px-4 py-3.5 text-slate-600">{(sub.faculty as any)?.profiles?.full_name ?? '—'}</td>
                    <td className="px-4 py-3.5 text-slate-600">{sub.department}</td>
                    <td className="px-4 py-3.5">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">Sem {sub.semester} / {sub.section}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add New Subject</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Subject Code *</label>
                  <input required value={form.subject_code} onChange={e => setForm(f => ({...f, subject_code: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="CS301" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Semester *</label>
                  <select value={form.semester} onChange={e => setForm(f => ({...f, semester: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-600 mb-1.5">Subject Name *</label>
                  <input required value={form.subject_name} onChange={e => setForm(f => ({...f, subject_name: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Database Management System" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Section</label>
                  <input value={form.section} onChange={e => setForm(f => ({...f, section: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="A" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Faculty</label>
                  <select value={form.faculty_id} onChange={e => setForm(f => ({...f, faculty_id: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select Faculty —</option>
                    {facultyList.map(fac => (
                      <option key={fac.id} value={fac.id}>{(fac.profiles as any)?.full_name ?? fac.employee_id}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-600 mb-1.5">Department *</label>
                  <input required value={form.department} onChange={e => setForm(f => ({...f, department: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Computer Science" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60">
                  {saving ? 'Creating...' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

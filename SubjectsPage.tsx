import { useEffect, useState } from 'react';
import { Search, Plus, X, AlertCircle, CheckCircle, Users, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Faculty } from '../../lib/types';

interface FacultyForm {
  full_name: string; email: string; password: string; phone: string;
  employee_id: string; department: string; designation: string;
}

const emptyForm: FacultyForm = {
  full_name: '', email: '', password: '', phone: '',
  employee_id: '', department: '', designation: 'Assistant Professor',
};

async function callEdgeFn(path: string, body: unknown) {
  const token = (await supabase.auth.getSession()).data.session?.access_token;
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Request failed');
  return data;
}

export default function FacultyPage() {
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FacultyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  async function fetchFaculty() {
    setLoading(true);
    const { data } = await supabase
      .from('faculty')
      .select('*, profiles(full_name, photo_url, phone)')
      .order('employee_id');
    setFaculty((data ?? []) as unknown as Faculty[]);
    setLoading(false);
  }

  useEffect(() => { fetchFaculty(); }, []);

  const filtered = faculty.filter(f => {
    const name = (f.profiles?.full_name ?? '').toLowerCase();
    const q = search.toLowerCase();
    return name.includes(q) || f.employee_id.toLowerCase().includes(q) || f.department.toLowerCase().includes(q);
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      await callEdgeFn('create-user', {
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        role: 'faculty',
        phone: form.phone || null,
        faculty_data: {
          employee_id: form.employee_id,
          department: form.department,
          designation: form.designation,
        },
      });
      setMsg({ type: 'success', text: 'Faculty account created successfully!' });
      setForm(emptyForm);
      setShowModal(false);
      fetchFaculty();
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeletingId(confirmDelete.id);
    setMsg(null);
    try {
      await callEdgeFn('delete-user', { target_user_id: confirmDelete.id });
      setMsg({ type: 'success', text: `${confirmDelete.name} has been removed.` });
      setConfirmDelete(null);
      fetchFaculty();
    } catch (err) {
      setMsg({ type: 'error', text: (err as Error).message });
    } finally {
      setDeletingId(null);
    }
  }

  const designationColors: Record<string, string> = {
    'Assistant Professor': 'bg-blue-100 text-blue-700',
    'Associate Professor': 'bg-violet-100 text-violet-700',
    'Professor': 'bg-emerald-100 text-emerald-700',
    'Head of Department': 'bg-amber-100 text-amber-700',
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

      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search faculty..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={16} />Add Faculty
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-emerald-600" />
            <h3 className="font-semibold text-slate-800">All Faculty</h3>
          </div>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{filtered.length} members</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 text-sm">Loading faculty...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Users size={40} className="mb-3 opacity-40" />
            <p className="text-sm">{search ? 'No faculty match your search' : 'No faculty yet. Add your first member!'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Faculty</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee ID</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Department</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Designation</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(member => {
                  const initials = (member.profiles?.full_name ?? 'F').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
                  const dColor = designationColors[member.designation] ?? 'bg-slate-100 text-slate-600';
                  return (
                    <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {member.profiles?.photo_url ? (
                            <img src={member.profiles.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                              {initials}
                            </div>
                          )}
                          <span className="font-medium text-slate-800">{member.profiles?.full_name ?? '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-slate-700">{member.employee_id}</td>
                      <td className="px-4 py-3.5 text-slate-700">{member.department}</td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${dColor}`}>
                          {member.designation}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{member.profiles?.phone ?? '—'}</td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={() => setConfirmDelete({ id: member.id, name: member.profiles?.full_name ?? 'this faculty' })}
                          disabled={deletingId === member.id}
                          className="inline-flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <Trash2 size={13} />Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Faculty Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800">Add New Faculty</h2>
              <button onClick={() => { setShowModal(false); setMsg(null); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs text-slate-600 mb-1.5">Full Name *</label>
                  <input required value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dr. / Prof. Full Name" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Email *</label>
                  <input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="faculty@email.com" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Password *</label>
                  <input required type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min. 6 characters" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-600 mb-1.5">Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Employee ID *</label>
                  <input required value={form.employee_id} onChange={e => setForm(f => ({...f, employee_id: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="EMP001" />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1.5">Designation</label>
                  <select value={form.designation} onChange={e => setForm(f => ({...f, designation: e.target.value}))} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Assistant Professor</option>
                    <option>Associate Professor</option>
                    <option>Professor</option>
                    <option>Head of Department</option>
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
                  {saving ? 'Creating...' : 'Create Faculty'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={24} className="text-red-600" />
            </div>
            <h3 className="font-semibold text-slate-800 mb-2">Delete Faculty?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently remove <span className="font-semibold text-slate-700">{confirmDelete.name}</span> and their account. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={!!deletingId}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {deletingId ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

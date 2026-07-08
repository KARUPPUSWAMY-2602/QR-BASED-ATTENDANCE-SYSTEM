import { useState } from 'react';
import { Settings, Shield, Database, Bell, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="max-w-2xl space-y-5">
      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl p-3.5 text-sm">
          <CheckCircle size={16} />
          Settings saved successfully!
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Settings size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">System Settings</h3>
        </div>
        <form onSubmit={handleSave} className="p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={16} className="text-slate-500" />
              <h4 className="text-sm font-semibold text-slate-700">Attendance Rules</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Minimum attendance threshold</p>
                  <p className="text-xs text-slate-500 mt-0.5">Students below this will be flagged</p>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" defaultValue={75} min={50} max={100} className="w-16 px-2 py-1.5 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-700">Default QR validity duration</p>
                  <p className="text-xs text-slate-500 mt-0.5">Default time before QR expires</p>
                </div>
                <select defaultValue="5" className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[2,3,5,10,15,30].map(v => <option key={v} value={v}>{v} minutes</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={16} className="text-slate-500" />
              <h4 className="text-sm font-semibold text-slate-700">Notifications</h4>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Low attendance alerts', desc: 'Notify when student falls below threshold' },
                { label: 'Daily attendance summary', desc: 'Send summary report at end of day' },
              ].map(({ label, desc }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-700">{label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-slate-200 peer-checked:bg-blue-600 rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-blue-500/30" />
                    <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4 shadow-sm" />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Database size={16} className="text-slate-500" />
              <h4 className="text-sm font-semibold text-slate-700">Institution Details</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-slate-500 mb-1.5">Institution Name</label>
                <input type="text" defaultValue="ABC College of Technology" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Academic Year</label>
                <input type="text" defaultValue="2025-2026" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Current Semester</label>
                <select defaultValue="6" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

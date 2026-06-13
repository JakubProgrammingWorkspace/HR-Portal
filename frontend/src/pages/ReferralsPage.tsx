import { useState } from 'react';
import { FileText, Search, Plus, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface Referral {
  id: string;
  employeeName: string;
  type: string;
  date: string;
  status: 'active' | 'completed' | 'overdue';
}

const mockReferrals: Referral[] = [
  { id: 'SK/2026/001', employeeName: 'Jan Kowalski', type: 'Badania Okresowe', date: '2026-06-10', status: 'active' },
  { id: 'SK/2026/002', employeeName: 'Anna Nowak', type: 'Badania Wstępne', date: '2026-06-12', status: 'active' },
  { id: 'SK/2026/003', employeeName: 'Piotr Wiśniewski', type: 'Badania Kontrolne', date: '2026-05-20', status: 'completed' },
  { id: 'SK/2026/004', employeeName: 'Maria Wójcik', type: 'Badania Okresowe', date: '2026-04-15', status: 'overdue' },
];

export default function ReferralsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = mockReferrals.filter(ref => 
    ref.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ref.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Skierowania</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Skierowania pracowników na badania lekarskie medycyny pracy.</p>
        </div>
        <button
          type="button"
          className="btn-magnetic bg-brand-moss hover:bg-brand-moss-light text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 self-start sm:self-auto shadow-md shadow-brand-moss/10"
        >
          <Plus className="w-4 h-4" />
          Nowe skierowanie
        </button>
      </div>

      {/* Filter panel */}
      <div className="flex gap-4 max-w-md">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Szukaj skierowania..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white"
          />
        </div>
      </div>

      {/* Table grid */}
      <div className="overflow-hidden border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-slate-50/50 dark:bg-slate-800/20">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Kod skierowania</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Pracownik</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Typ badania</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Data wystawienia</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((ref) => (
              <tr key={ref.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300 font-medium">{ref.id}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">{ref.employeeName}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{ref.type}</td>
                <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{ref.date}</td>
                <td className="px-6 py-4 text-sm">
                  {ref.status === 'active' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/20 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                      <Clock className="w-3.5 h-3.5" />
                      W toku
                    </span>
                  )}
                  {ref.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Ukończone
                    </span>
                  )}
                  {ref.status === 'overdue' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/20 px-2.5 py-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Przeterminowane
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                  Brak aktywnego skierowania.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


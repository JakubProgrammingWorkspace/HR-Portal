import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  FileText,
  ShieldAlert,
  Terminal as TerminalIcon,
} from 'lucide-react';
import { apiFetch } from '../api/client';

interface Stats {
  employees: number;
  companies: number;
  exposureFactors: number;
  referrals: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ employees: 0, companies: 0, exposureFactors: 0, referrals: 0 });
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    async function fetchTotalItems(path: string): Promise<number> {
      const response = await apiFetch(path, { headers: { Accept: 'application/ld+json' } });
      if (!response.ok) {
        return 0;
      }
      const data = (await response.json()) as { totalItems?: number };
      return data.totalItems ?? 0;
    }

    async function fetchStats() {
      try {
        const [employees, companies, exposureFactors, referrals] = await Promise.all([
          fetchTotalItems('/api/employees'),
          fetchTotalItems('/api/companies'),
          fetchTotalItems('/api/exposure-factors'),
          fetchTotalItems('/api/referrals'),
        ]);

        setStats({ employees, companies, exposureFactors, referrals });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Simulator for telemetry feeds
  useEffect(() => {
    const messages = [
      'Połączenie z bazą danych Symfony: OK',
      'Weryfikacja certyfikatów bezpieczeństwa: Zweryfikowano',
      'Indeksowanie bazy czynników narażeń: Ukończono',
      'Pobieranie najnowszych skierowań lekarskich...',
      'Wszystkie systemy działają prawidłowo.',
      'Zsynchronizowano wpisy pracowników z ZUS.',
    ];
    
    setLogs([messages[0], messages[1]]);
    
    const interval = setInterval(() => {
      setLogs((prev) => {
        const nextMsg = messages[Math.floor(Math.random() * messages.length)];
        return [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${nextMsg}`];
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Podsumowanie statystyk i operacji systemowych HR-Portal.</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Wszyscy pracownicy" 
          value={loading ? '...' : stats.employees} 
          subtext="+2 w tym miesiącu" 
          icon={Users} 
          color="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
        />
        <StatCard 
          title="Zarejestrowane firmy" 
          value={loading ? '...' : stats.companies} 
          subtext="Współpracujące podmioty" 
          icon={Building2} 
          color="bg-blue-500/10 text-blue-600 dark:text-blue-400" 
        />
        <StatCard 
          title="Czynniki szkodliwe" 
          value={loading ? '...' : stats.exposureFactors} 
          subtext="W katalogu narażeń" 
          icon={ShieldAlert} 
          color="bg-amber-500/10 text-amber-600 dark:text-amber-400" 
        />
        <StatCard 
          title="Skierowania" 
          value={loading ? '...' : stats.referrals} 
          subtext="Aktywne zlecenia badań" 
          icon={FileText} 
          color="bg-rose-500/10 text-rose-600 dark:text-rose-400" 
        />
      </div>

      {/* Visual Analytics Split Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* SVG Sparkline Activity Graph */}
        <div className="card-tactile p-6 bg-white dark:bg-slate-900 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">Aktywność systemu</h2>
              <span className="text-xs text-slate-400 font-mono">Ostatnie 7 dni</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Liczba wygenerowanych dokumentów i skierowań.</p>
          </div>
          
          <div className="h-48 w-full mt-6 relative flex items-end">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 700 150">
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#276648" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#276648" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="25" x2="700" y2="25" stroke="rgba(226,232,240,0.1)" strokeDasharray="5,5" />
              <line x1="0" y1="75" x2="700" y2="75" stroke="rgba(226,232,240,0.1)" strokeDasharray="5,5" />
              <line x1="0" y1="125" x2="700" y2="125" stroke="rgba(226,232,240,0.1)" strokeDasharray="5,5" />
              
              {/* Gradient Area under line */}
              <path 
                d="M0,150 L0,110 L100,120 L200,80 L300,105 L400,40 L500,90 L600,30 L700,45 L700,150 Z" 
                fill="url(#grad)" 
              />
              {/* Smooth curve line */}
              <path 
                d="M0,110 Q50,115 100,120 T200,80 T300,105 T400,40 T500,90 T600,30 T700,45" 
                fill="none" 
                stroke="#276648"
                strokeWidth="3.5" 
                strokeLinecap="round"
              />
              {/* Interactive Dots */}
              <circle cx="400" cy="40" r="5" fill="#276648" stroke="#ffffff" strokeWidth="2" />
              <circle cx="600" cy="30" r="5" fill="#276648" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>

          <div className="flex justify-between items-center text-xs font-mono text-slate-400 mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
            <span>Pon</span>
            <span>Wt</span>
            <span>Śr</span>
            <span>Czw</span>
            <span>Pt</span>
            <span>Sob</span>
            <span>Niedz</span>
          </div>
        </div>

        {/* Dynamic Telemetry Terminal Feed */}
        <div className="card-tactile p-6 bg-slate-950 text-slate-300 font-mono text-xs flex flex-col justify-between border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <TerminalIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-400 font-bold">Telemetry Feed</span>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          </div>

          <div className="flex-1 space-y-2 overflow-hidden h-40">
            {logs.map((log, index) => (
              <p key={index} className="text-emerald-400/90 leading-relaxed truncate">
                <span className="text-slate-600">&gt;</span> {log}
              </p>
            ))}
          </div>

          <div className="border-t border-slate-900 pt-3 mt-4 text-[10px] text-slate-500 flex justify-between">
            <span>Server status: Operational</span>
            <span>v0.0.1</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtext: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

function StatCard({ title, value, subtext, icon: Icon, color }: StatCardProps) {
  return (
    <div className="card-tactile p-6 bg-white dark:bg-slate-900 flex items-center justify-between group">
      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{title}</span>
        <h3 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white group-hover:scale-105 transition-transform origin-left duration-300">
          {value}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">{subtext}</p>
      </div>
      <div className={`p-4 rounded-2xl ${color} transition-transform group-hover:rotate-12`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}


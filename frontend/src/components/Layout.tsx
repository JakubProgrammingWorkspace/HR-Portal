import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken, getCurrentUser, hasRole } from '../api/client';
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldAlert,
  FileText,
  LogOut,
  UserCheck
} from 'lucide-react';

const ALL_NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/users', label: 'Użytkownicy', icon: Users, adminOnly: true },
  { to: '/companies', label: 'Firmy', icon: Building2 },
  { to: '/employees', label: 'Pracownicy', icon: UserCheck },
  { to: '/exposure-factors', label: 'Czynniki narażeń', icon: ShieldAlert },
  { to: '/referrals', label: 'Skierowania', icon: FileText },
];

export default function Layout() {
  const navigate = useNavigate();
  const isAdmin = hasRole('ROLE_ADMIN');
  const navItems = ALL_NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);
  const user = getCurrentUser();

  function handleLogout() {
    clearToken();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-brand-cream text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex fixed left-4 top-4 bottom-4 w-68 flex-col rounded-[2rem] border border-slate-200 bg-white/95 dark:bg-slate-900 dark:border-slate-700 backdrop-blur-xl shadow-lg p-6 justify-between">
        <div>
          <div className="flex items-center gap-3 px-2 py-4">
            <div className="w-8 h-8 rounded-lg bg-brand-moss flex items-center justify-center text-white font-bold">H</div>
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">HR-Portal</span>
          </div>
          <nav className="mt-6 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                      isActive 
                        ? 'bg-brand-moss text-white shadow-md shadow-brand-moss/10' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-brand-moss-light hover:translate-x-1'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/40 dark:border-slate-700/50">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">System Ready</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="btn-magnetic w-full flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-rust dark:hover:text-brand-rust transition-colors shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            Wyloguj
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col md:pl-76 pb-20 md:pb-0">
        <header className="flex h-16 items-center justify-between px-6 md:px-8 border-b border-slate-200/60 dark:border-slate-700 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
          <div className="text-lg font-bold tracking-tight text-slate-800 dark:text-white">Panel Administracyjny</div>
          <div className="flex items-center gap-4">
            {user && (
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{user.email}</span>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="btn-magnetic flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-brand-rust dark:hover:text-brand-rust transition-colors shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              Wyloguj
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/60 dark:border-slate-700 z-50 flex justify-around items-center px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all ${
                  isActive 
                    ? 'text-brand-moss dark:text-brand-moss-light scale-105' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[50px]">{item.label}</span>
            </NavLink>
          );
        })}
        <button
          type="button"
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-0.5 rounded-lg px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:text-brand-rust"
        >
          <LogOut className="w-5 h-5" />
          Wyloguj
        </button>
      </nav>
    </div>
  );
}


import { NavLink, Outlet } from 'react-router-dom';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Użytkownicy' },
  { to: '/companies', label: 'Firmy' },
  { to: '/employees', label: 'Pracownicy' },
  { to: '/exposure-factors', label: 'Czynniki narażeń' },
  { to: '/referrals', label: 'Skierowania' },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="flex w-64 flex-col border-r border-gray-200 bg-white">
        <div className="px-6 py-4 text-xl font-bold text-gray-800">HR-Portal</div>
        <nav className="flex-1 space-y-1 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-md px-4 py-2 text-sm font-medium ${
                  isActive ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
          <div className="text-lg font-semibold text-gray-800">Panel</div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Użytkownik</span>
            <button
              type="button"
              className="text-sm font-medium text-blue-600 hover:text-blue-800"
            >
              Wyloguj
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

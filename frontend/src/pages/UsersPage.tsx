import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch, getCurrentUser } from '../api/client';
import { Plus, Trash2, Shield, UserX, UserCheck, X, Save, ShieldAlert, Mail } from 'lucide-react';

interface UserRow {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  active: boolean;
  roleCodes: string[];
}

interface RoleOption {
  id: number;
  code: string;
  name: string;
}

const MERGE_PATCH_HEADERS = { 'Content-Type': 'application/merge-patch+json' };

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { detail?: string };
    if (body.detail) {
      return body.detail;
    }
  } catch {
    // ignore
  }
  return 'Wystąpił błąd. Spróbuj ponownie.';
}

function sameRoles(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((code, index) => code === sortedB[index]);
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [pendingRoles, setPendingRoles] = useState<Record<number, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [savingRolesFor, setSavingRolesFor] = useState<number | null>(null);

  const currentUserId = getCurrentUser()?.id ?? null;

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [usersResponse, rolesResponse] = await Promise.all([
        apiFetch('/api/users'),
        apiFetch('/api/roles'),
      ]);

      if (!usersResponse.ok || !rolesResponse.ok) {
        setError('Nie udało się wczytać danych.');
        return;
      }

      const usersData = (await usersResponse.json()) as UserRow[];
      const rolesData = (await rolesResponse.json()) as RoleOption[];

      setUsers(usersData);
      setRoles(rolesData);
      setPendingRoles(Object.fromEntries(usersData.map((user) => [user.id, user.roleCodes])));
    } catch {
      setError('Nie udało się wczytać danych.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(user: UserRow) {
    if (!window.confirm(`Czy na pewno usunąć użytkownika ${user.email}?`)) {
      return;
    }

    setError(null);
    const response = await apiFetch(`/api/users/${user.id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError(await extractErrorMessage(response));
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  async function handleToggleActive(user: UserRow) {
    const confirmText = user.active
      ? `Czy na pewno dezaktywować użytkownika ${user.email}?`
      : `Czy na pewno aktywować użytkownika ${user.email}?`;
    if (!window.confirm(confirmText)) {
      return;
    }

    setError(null);
    const response = await apiFetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers: MERGE_PATCH_HEADERS,
      body: JSON.stringify({ isActive: !user.active }),
    });
    if (!response.ok) {
      setError(await extractErrorMessage(response));
      return;
    }

    const updated = (await response.json()) as UserRow;
    setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, active: updated.active } : u)));
  }

  function handleRoleSelectionChange(userId: number, selectedOptions: HTMLCollectionOf<HTMLOptionElement>) {
    const selected = Array.from(selectedOptions)
      .filter((option) => option.selected)
      .map((option) => option.value);
    setPendingRoles((prev) => ({ ...prev, [userId]: selected }));
  }

  async function handleSaveRoles(user: UserRow) {
    setError(null);
    setSavingRolesFor(user.id);
    try {
      const response = await apiFetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: MERGE_PATCH_HEADERS,
        body: JSON.stringify({ roles: pendingRoles[user.id] ?? [] }),
      });
      if (!response.ok) {
        setError(await extractErrorMessage(response));
        return;
      }

      const updated = (await response.json()) as UserRow;
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, roleCodes: updated.roleCodes } : u)));
      setPendingRoles((prev) => ({ ...prev, [user.id]: updated.roleCodes }));
    } finally {
      setSavingRolesFor(null);
    }
  }

  function handleUserCreated(user: UserRow) {
    setUsers((prev) => [...prev, user]);
    setPendingRoles((prev) => ({ ...prev, [user.id]: user.roleCodes }));
    setIsAddOpen(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-800 dark:text-white">Użytkownicy</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Zarządzanie uprawnieniami, rolami oraz statusem aktywności użytkowników systemu.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="btn-magnetic bg-brand-moss hover:bg-brand-moss-light text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 self-start sm:self-auto shadow-md shadow-brand-moss/10"
        >
          <Plus className="w-4 h-4" />
          Dodaj użytkownika
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-4 py-2.5 text-sm font-medium text-brand-rust border border-red-200/20">{error}</p>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="shimmer h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-white dark:bg-slate-900/80">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Dane użytkownika</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Uprawnienia / Przypisane role</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Status</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Akcje konta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const selected = pendingRoles[user.id] ?? user.roleCodes;
                  const rolesChanged = !sameRoles(selected, user.roleCodes);

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800 dark:text-white">{user.firstName} {user.lastName}</span>
                          <span className="text-xs font-mono text-slate-500 mt-0.5">{user.email}</span>
                          {isSelf && (
                            <span className="inline-flex self-start mt-1 rounded bg-brand-moss/10 text-brand-moss text-[10px] px-1.5 py-0.5 font-bold">To Twoje konto</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <select
                            multiple
                            value={selected}
                            onChange={(event) => handleRoleSelectionChange(user.id, event.target.options)}
                            className="min-w-[10rem] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs focus:border-brand-moss focus:outline-none dark:text-white"
                            size={Math.min(4, Math.max(2, roles.length))}
                          >
                            {roles.map((role) => (
                              <option key={role.code} value={role.code}>
                                {role.name} ({role.code})
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => handleSaveRoles(user)}
                            disabled={!rolesChanged || savingRolesFor === user.id}
                            className="btn-magnetic rounded-xl bg-brand-moss text-white px-3 py-2 text-xs font-semibold disabled:opacity-30 disabled:pointer-events-none hover:shadow-md flex items-center gap-1.5"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingRolesFor === user.id ? 'Zapis...' : 'Zapisz'}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            user.active 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400' 
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          {user.active ? 'Aktywny' : 'Dezaktywowany'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            disabled={isSelf}
                            title={isSelf ? 'Nie można zmienić własnego konta' : undefined}
                            className="btn-magnetic p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-brand-moss hover:text-white dark:hover:bg-brand-moss transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          >
                            {user.active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(user)}
                            disabled={isSelf}
                            title={isSelf ? 'Nie można usunąć własnego konta' : undefined}
                            className="btn-magnetic p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-brand-rust hover:bg-brand-rust hover:text-white dark:hover:bg-brand-rust dark:hover:text-white transition-colors disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isAddOpen && (
        <AddUserModal roles={roles} onClose={() => setIsAddOpen(false)} onCreated={handleUserCreated} />
      )}
    </div>
  );
}

interface AddUserModalProps {
  roles: RoleOption[];
  onClose: () => void;
  onCreated: (user: UserRow) => void;
}

function AddUserModal({ roles, onClose, onCreated }: AddUserModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleRolesChange(options: HTMLCollectionOf<HTMLOptionElement>) {
    setSelectedRoles(Array.from(options).filter((option) => option.selected).map((option) => option.value));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({ email, password, firstName, lastName, roles: selectedRoles }),
      });

      if (!response.ok) {
        setError(await extractErrorMessage(response));
        return;
      }

      const created = (await response.json()) as UserRow;
      onCreated(created);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm z-50 p-4">
      <div className="w-full max-w-md card-tactile p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700 shadow-2xl relative animate-scale-up">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="font-serif text-xl font-semibold text-slate-800 dark:text-white">Nowy Użytkownik Systemu</h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-user-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              E-mail
            </label>
            <input
              id="new-user-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <div>
            <label htmlFor="new-user-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Hasło dostępu
            </label>
            <input
              id="new-user-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-user-first-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Imię
              </label>
              <input
                id="new-user-first-name"
                type="text"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
            <div>
              <label htmlFor="new-user-last-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Nazwisko
              </label>
              <input
                id="new-user-last-name"
                type="text"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="new-user-roles" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Role
            </label>
            <select
              id="new-user-roles"
              multiple
              value={selectedRoles}
              onChange={(event) => handleRolesChange(event.target.options)}
              size={Math.min(4, Math.max(2, roles.length))}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            >
              {roles.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </div>
          
          {error && (
            <p className="text-sm font-medium text-brand-rust">{error}</p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-magnetic rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-magnetic rounded-xl bg-brand-moss hover:bg-brand-moss-light text-white px-5 py-2.5 text-sm font-semibold hover:shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Tworzenie...' : 'Stwórz użytkownika'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


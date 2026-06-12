import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch, getCurrentUser } from '../api/client';

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
    // ignore - fall through to the generic message below
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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Użytkownicy</h1>
          <p className="mt-2 text-sm text-gray-600">Zarządzanie użytkownikami i rolami.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Dodaj użytkownika
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-gray-600">Wczytywanie...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Imię i nazwisko</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                const selected = pendingRoles[user.id] ?? user.roleCodes;
                const rolesChanged = !sameRoles(selected, user.roleCodes);

                return (
                  <tr key={user.id}>
                    <td className="px-4 py-3 text-sm text-gray-800">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {user.firstName} {user.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <div className="flex items-center gap-2">
                        <select
                          multiple
                          value={selected}
                          onChange={(event) => handleRoleSelectionChange(user.id, event.target.options)}
                          className="min-w-[10rem] rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                          className="rounded-md bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Zapisz
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          user.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {user.active ? 'Aktywny' : 'Nieaktywny'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(user)}
                          disabled={isSelf}
                          title={isSelf ? 'Nie można zmienić własnego konta' : undefined}
                          className="font-medium text-blue-600 hover:text-blue-800 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          {user.active ? 'Dezaktywuj' : 'Aktywuj'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(user)}
                          disabled={isSelf}
                          title={isSelf ? 'Nie można usunąć własnego konta' : undefined}
                          className="font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:text-gray-400"
                        >
                          Usuń
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
    <div className="fixed inset-0 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-bold text-gray-800">Dodaj użytkownika</h2>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="new-user-email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="new-user-email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="new-user-password" className="block text-sm font-medium text-gray-700">
              Hasło
            </label>
            <input
              id="new-user-password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="new-user-first-name" className="block text-sm font-medium text-gray-700">
                Imię
              </label>
              <input
                id="new-user-first-name"
                type="text"
                required
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="new-user-last-name" className="block text-sm font-medium text-gray-700">
                Nazwisko
              </label>
              <input
                id="new-user-last-name"
                type="text"
                required
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="new-user-roles" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <select
              id="new-user-roles"
              multiple
              value={selectedRoles}
              onChange={(event) => handleRolesChange(event.target.options)}
              size={Math.min(4, Math.max(2, roles.length))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {roles.map((role) => (
                <option key={role.code} value={role.code}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Dodaj
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

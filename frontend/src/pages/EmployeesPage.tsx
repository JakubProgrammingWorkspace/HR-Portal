import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '../api/client';

interface CompanyOption {
  id: number;
  name: string;
}

interface EmployeeRow {
  id: number;
  firstName: string;
  lastName: string;
  pesel: string;
  phone: string;
  email: string;
  address: string;
  company: string;
}

interface FieldErrors {
  firstName?: string;
  lastName?: string;
  pesel?: string;
  phone?: string;
  email?: string;
  address?: string;
  company?: string;
}

const PESEL_PATTERN = /^\d{11}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ApiViolation {
  propertyPath: string;
  message: string;
}

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

async function extractFieldErrors(response: Response): Promise<FieldErrors> {
  try {
    const body = (await response.json()) as { violations?: ApiViolation[] };
    if (body.violations) {
      const errors: FieldErrors = {};
      for (const violation of body.violations) {
        errors[violation.propertyPath as keyof FieldErrors] = violation.message;
      }
      return errors;
    }
  } catch {
    // ignore - no field-level errors available
  }

  return {};
}

function companyIdFromIri(iri: string): string {
  return iri.split('/').pop() ?? '';
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [employeesResponse, companiesResponse] = await Promise.all([
        apiFetch('/api/employees'),
        apiFetch('/api/companies'),
      ]);

      if (!employeesResponse.ok || !companiesResponse.ok) {
        setError('Nie udało się wczytać danych.');
        return;
      }

      setEmployees((await employeesResponse.json()) as EmployeeRow[]);
      setCompanies((await companiesResponse.json()) as CompanyOption[]);
    } catch {
      setError('Nie udało się wczytać danych.');
    } finally {
      setLoading(false);
    }
  }

  const companyNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const company of companies) {
      map.set(`/api/companies/${company.id}`, company.name);
    }
    return map;
  }, [companies]);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return employees.filter((employee) => {
      const matchesSearch =
        !term ||
        employee.firstName.toLowerCase().includes(term) ||
        employee.lastName.toLowerCase().includes(term);
      const matchesCompany = !companyFilter || companyIdFromIri(employee.company) === companyFilter;
      return matchesSearch && matchesCompany;
    });
  }, [employees, searchTerm, companyFilter]);

  async function handleDelete(employee: EmployeeRow) {
    if (!window.confirm(`Czy na pewno usunąć pracownika ${employee.firstName} ${employee.lastName}?`)) {
      return;
    }

    setError(null);
    const response = await apiFetch(`/api/employees/${employee.id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError(await extractErrorMessage(response));
      return;
    }

    setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
  }

  function handleCreated(employee: EmployeeRow) {
    setEmployees((prev) => [...prev, employee]);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Pracownicy</h1>
      <p className="mt-2 text-sm text-gray-600">Zarządzanie pracownikami.</p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <AddEmployeeForm companies={companies} onCreated={handleCreated} />

      <div className="mt-6 flex flex-wrap gap-4">
        <div>
          <label htmlFor="employee-search" className="block text-sm font-medium text-gray-700">
            Szukaj
          </label>
          <input
            id="employee-search"
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Imię lub nazwisko"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="employee-company-filter" className="block text-sm font-medium text-gray-700">
            Firma
          </label>
          <select
            id="employee-company-filter"
            value={companyFilter}
            onChange={(event) => setCompanyFilter(event.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Wszystkie firmy</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-gray-600">Wczytywanie...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Imię i nazwisko</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Telefon</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">E-mail</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Adres</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Firma</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {employee.firstName} {employee.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{employee.phone}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{employee.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{employee.address}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {companyNames.get(employee.company) ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => handleDelete(employee)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-3 text-sm text-gray-500">
                    Brak pracowników.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface AddEmployeeFormProps {
  companies: CompanyOption[];
  onCreated: (employee: EmployeeRow) => void;
}

function AddEmployeeForm({ companies, onCreated }: AddEmployeeFormProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [pesel, setPesel] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!firstName.trim()) {
      errors.firstName = 'Imię jest wymagane.';
    }
    if (!lastName.trim()) {
      errors.lastName = 'Nazwisko jest wymagane.';
    }
    if (!pesel.trim()) {
      errors.pesel = 'PESEL jest wymagany.';
    } else if (!PESEL_PATTERN.test(pesel.trim())) {
      errors.pesel = 'PESEL musi składać się z 11 cyfr.';
    }
    if (!phone.trim()) {
      errors.phone = 'Telefon jest wymagany.';
    }
    if (!email.trim()) {
      errors.email = 'E-mail jest wymagany.';
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      errors.email = 'Adres e-mail jest nieprawidłowy.';
    }
    if (!address.trim()) {
      errors.address = 'Adres jest wymagany.';
    }
    if (!companyId) {
      errors.company = 'Firma jest wymagana.';
    }
    return errors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const validationErrors = validate();
    setFieldErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/employees', {
        method: 'POST',
        body: JSON.stringify({
          firstName,
          lastName,
          pesel,
          phone,
          email,
          address,
          company: `/api/companies/${companyId}`,
        }),
      });

      if (!response.ok) {
        if (response.status === 422) {
          setFieldErrors(await extractFieldErrors(response));
        } else {
          setError(await extractErrorMessage(response));
        }
        return;
      }

      const created = (await response.json()) as EmployeeRow;
      onCreated(created);
      setFirstName('');
      setLastName('');
      setPesel('');
      setPhone('');
      setEmail('');
      setAddress('');
      setCompanyId('');
      setFieldErrors({});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800">Dodaj pracownika</h2>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee-first-name" className="block text-sm font-medium text-gray-700">
              Imię
            </label>
            <input
              id="employee-first-name"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.firstName && <p className="mt-1 text-sm text-red-600">{fieldErrors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="employee-last-name" className="block text-sm font-medium text-gray-700">
              Nazwisko
            </label>
            <input
              id="employee-last-name"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.lastName && <p className="mt-1 text-sm text-red-600">{fieldErrors.lastName}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee-pesel" className="block text-sm font-medium text-gray-700">
              PESEL
            </label>
            <input
              id="employee-pesel"
              type="text"
              value={pesel}
              onChange={(event) => setPesel(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.pesel && <p className="mt-1 text-sm text-red-600">{fieldErrors.pesel}</p>}
          </div>
          <div>
            <label htmlFor="employee-phone" className="block text-sm font-medium text-gray-700">
              Telefon
            </label>
            <input
              id="employee-phone"
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.phone && <p className="mt-1 text-sm text-red-600">{fieldErrors.phone}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee-email" className="block text-sm font-medium text-gray-700">
              E-mail
            </label>
            <input
              id="employee-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="employee-company" className="block text-sm font-medium text-gray-700">
              Firma
            </label>
            <select
              id="employee-company"
              value={companyId}
              onChange={(event) => setCompanyId(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Wybierz firmę</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            {fieldErrors.company && <p className="mt-1 text-sm text-red-600">{fieldErrors.company}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="employee-address" className="block text-sm font-medium text-gray-700">
            Adres
          </label>
          <input
            id="employee-address"
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {fieldErrors.address && <p className="mt-1 text-sm text-red-600">{fieldErrors.address}</p>}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end">
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
  );
}

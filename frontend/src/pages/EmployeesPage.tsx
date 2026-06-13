import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '../api/client';
import { Plus, Search, Filter, Trash2, Mail, Phone, MapPin, User, ChevronDown } from 'lucide-react';

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
    // ignore
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
    // ignore
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
  const [isFormOpen, setIsFormOpen] = useState(false);

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
    setIsFormOpen(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Pracownicy</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Zarządzanie kartotekami i danymi kontaktowymi pracowników.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-magnetic bg-brand-moss hover:bg-brand-moss-light text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 self-start sm:self-auto shadow-md shadow-brand-moss/10"
        >
          <Plus className="w-4 h-4" />
          {isFormOpen ? 'Zamknij formularz' : 'Dodaj pracownika'}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-4 py-2.5 text-sm font-medium text-brand-rust border border-red-200/20">{error}</p>
      )}

      {isFormOpen && (
        <div className="animate-slide-down">
          <AddEmployeeForm companies={companies} onCreated={handleCreated} />
        </div>
      )}

      {/* Filter panel */}
      <div className="card-tactile p-4 bg-white dark:bg-slate-900 flex flex-wrap gap-4 items-end">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="employee-search" className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Wyszukaj pracownika
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              id="employee-search"
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Imię lub nazwisko..."
              className="pl-10 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white"
            />
          </div>
        </div>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="employee-company-filter" className="block text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
            Filtruj według firmy
          </label>
          <div className="relative">
            <select
              id="employee-company-filter"
              value={companyFilter}
              onChange={(event) => setCompanyFilter(event.target.value)}
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-sm appearance-none focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white"
            >
              <option value="">Wszystkie firmy</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4 mt-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="shimmer h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-100 dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-slate-50/50 dark:bg-slate-800/20">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Imię i nazwisko / PESEL</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Kontakt</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Adres zamieszkania</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Przypisana firma</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-800 dark:text-white">
                            {employee.firstName} {employee.lastName}
                          </div>
                          <div className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                            PESEL: {employee.pesel}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono">{employee.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{employee.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400 max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{employee.address}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-800 dark:text-slate-300">
                        {companyNames.get(employee.company) ?? '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(employee)}
                        className="btn-magnetic p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-brand-rust hover:bg-brand-rust hover:text-white dark:hover:bg-brand-rust dark:hover:text-white transition-colors"
                        title="Usuń pracownika"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">
                      Brak zarejestrowanych pracowników spełniających kryteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
    <div className="card-tactile p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-md">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Dodaj nowego pracownika</h2>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee-first-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Imię
            </label>
            <input
              id="employee-first-name"
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white"
            />
            {fieldErrors.firstName && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.firstName}</p>}
          </div>
          <div>
            <label htmlFor="employee-last-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nazwisko
            </label>
            <input
              id="employee-last-name"
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white"
            />
            {fieldErrors.lastName && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.lastName}</p>}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee-pesel" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              PESEL
            </label>
            <input
              id="employee-pesel"
              type="text"
              value={pesel}
              onChange={(event) => setPesel(event.target.value)}
              placeholder="11 cyfr"
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white font-mono"
            />
            {fieldErrors.pesel && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.pesel}</p>}
          </div>
          <div>
            <label htmlFor="employee-phone" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Telefon
            </label>
            <input
              id="employee-phone"
              type="text"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white font-mono"
            />
            {fieldErrors.phone && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="employee-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              E-mail
            </label>
            <input
              id="employee-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="example@mail.com"
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white"
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="employee-company" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Firma
            </label>
            <div className="relative mt-1">
              <select
                id="employee-company"
                value={companyId}
                onChange={(event) => setCompanyId(event.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-sm appearance-none focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white"
              >
                <option value="">Wybierz firmę</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
            {fieldErrors.company && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.company}</p>}
          </div>
        </div>

        <div>
          <label htmlFor="employee-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Adres zamieszkania
          </label>
          <input
            id="employee-address"
            type="text"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white"
          />
          {fieldErrors.address && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.address}</p>}
        </div>

        {error && <p className="text-sm font-medium text-brand-rust">{error}</p>}
        
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-magnetic rounded-xl bg-brand-moss hover:bg-brand-moss-light text-white px-5 py-2.5 text-sm font-semibold hover:shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz pracownika'}
          </button>
        </div>
      </form>
    </div>
  );
}


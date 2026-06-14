import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '../api/client';
import { Plus, Trash2, Building2, MapPin, Hash, Briefcase } from 'lucide-react';

interface CompanyRow {
  id: number;
  name: string;
  nip: string;
  street: string;
  city: string;
  postalCode: string;
}

interface FieldErrors {
  name?: string;
  nip?: string;
  street?: string;
  city?: string;
  postalCode?: string;
}

const NIP_PATTERN = /^\d{10}$/;

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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/companies');
      if (!response.ok) {
        setError('Nie udało się wczytać danych.');
        return;
      }

      setCompanies((await response.json()) as CompanyRow[]);
    } catch {
      setError('Nie udało się wczytać danych.');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(company: CompanyRow) {
    if (!window.confirm(`Czy na pewno usunąć firmę ${company.name}?`)) {
      return;
    }

    setError(null);
    const response = await apiFetch(`/api/companies/${company.id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError(await extractErrorMessage(response));
      return;
    }

    setCompanies((prev) => prev.filter((c) => c.id !== company.id));
  }

  function handleCreated(company: CompanyRow) {
    setCompanies((prev) => [...prev, company]);
    setIsFormOpen(false);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-800 dark:text-white">Firmy</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Zarządzanie rejestrem partnerów biznesowych i powiązanych firm.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsFormOpen(!isFormOpen)}
          className="btn-magnetic bg-brand-moss hover:bg-brand-moss-light text-white rounded-xl px-4 py-2.5 text-sm font-semibold flex items-center gap-2 self-start sm:self-auto shadow-md shadow-brand-moss/10"
        >
          <Plus className="w-4 h-4" />
          {isFormOpen ? 'Zamknij formularz' : 'Dodaj firmę'}
        </button>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-4 py-2.5 text-sm font-medium text-brand-rust border border-red-200/20">{error}</p>
      )}

      {isFormOpen && (
        <div className="animate-slide-down">
          <AddCompanyForm onCreated={handleCreated} />
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="shimmer h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden border border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
              <thead className="bg-white dark:bg-slate-900/80">
                <tr>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Nazwa firmy</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">NIP</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Adres rejestrowy</th>
                  <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-semibold text-slate-800 dark:text-white">{company.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-300 font-medium">
                      {company.nip}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{company.street}, {company.postalCode} {company.city}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        type="button"
                        onClick={() => handleDelete(company)}
                        className="btn-magnetic p-2 rounded-lg bg-red-50 dark:bg-red-950/20 text-brand-rust hover:bg-brand-rust hover:text-white dark:hover:bg-brand-rust dark:hover:text-white transition-colors"
                        title="Usuń firmę"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">
                      Brak firm w bazie danych.
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

interface AddCompanyFormProps {
  onCreated: (company: CompanyRow) => void;
}

function AddCompanyForm({ onCreated }: AddCompanyFormProps) {
  const [name, setName] = useState('');
  const [nip, setNip] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!name.trim()) {
      errors.name = 'Nazwa jest wymagana.';
    }
    if (!nip.trim()) {
      errors.nip = 'NIP jest wymagany.';
    } else if (!NIP_PATTERN.test(nip.trim())) {
      errors.nip = 'NIP musi składać się z 10 cyfr.';
    }
    if (!street.trim()) {
      errors.street = 'Ulica jest wymagana.';
    }
    if (!city.trim()) {
      errors.city = 'Miasto jest wymagane.';
    }
    if (!postalCode.trim()) {
      errors.postalCode = 'Kod pocztowy jest wymagany.';
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
      const response = await apiFetch('/api/companies', {
        method: 'POST',
        body: JSON.stringify({ name, nip, street, city, postalCode }),
      });

      if (!response.ok) {
        if (response.status === 422) {
          setFieldErrors(await extractFieldErrors(response));
        } else {
          setError(await extractErrorMessage(response));
        }
        return;
      }

      const created = (await response.json()) as CompanyRow;
      onCreated(created);
      setName('');
      setNip('');
      setStreet('');
      setCity('');
      setPostalCode('');
      setFieldErrors({});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card-tactile p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700 shadow-md">
      <h2 className="font-serif text-lg font-semibold text-slate-800 dark:text-white">Dodaj nową firmę</h2>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Nazwa firmy
            </label>
            <input
              id="company-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="company-nip" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              NIP
            </label>
            <input
              id="company-nip"
              type="text"
              value={nip}
              onChange={(event) => setNip(event.target.value)}
              placeholder="10 cyfr"
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
            />
            {fieldErrors.nip && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.nip}</p>}
          </div>
        </div>
        
        <div>
          <label htmlFor="company-street" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Ulica i numer
          </label>
          <input
            id="company-street"
            type="text"
            value={street}
            onChange={(event) => setStreet(event.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {fieldErrors.street && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.street}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company-city" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Miasto
            </label>
            <input
              id="company-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {fieldErrors.city && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.city}</p>}
          </div>
          <div>
            <label htmlFor="company-postal-code" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Kod pocztowy
            </label>
            <input
              id="company-postal-code"
              type="text"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              placeholder="00-000"
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 font-mono"
            />
            {fieldErrors.postalCode && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.postalCode}</p>}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-brand-rust">{error}</p>}
        
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-magnetic rounded-xl bg-brand-moss hover:bg-brand-moss-light text-white px-5 py-2.5 text-sm font-semibold hover:shadow-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Zapisywanie...' : 'Zapisz firmę'}
          </button>
        </div>
      </form>
    </div>
  );
}


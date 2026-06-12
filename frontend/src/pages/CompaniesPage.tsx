import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '../api/client';

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

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Firmy</h1>
      <p className="mt-2 text-sm text-gray-600">Zarządzanie firmami.</p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <AddCompanyForm onCreated={handleCreated} />

      {loading ? (
        <p className="mt-6 text-sm text-gray-600">Wczytywanie...</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Nazwa</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">NIP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Adres</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Akcje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id}>
                  <td className="px-4 py-3 text-sm text-gray-800">{company.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{company.nip}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {company.street}, {company.postalCode} {company.city}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => handleDelete(company)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-sm text-gray-500">
                    Brak firm.
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
    <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800">Dodaj firmę</h2>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
              Nazwa
            </label>
            <input
              id="company-name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="company-nip" className="block text-sm font-medium text-gray-700">
              NIP
            </label>
            <input
              id="company-nip"
              type="text"
              value={nip}
              onChange={(event) => setNip(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.nip && <p className="mt-1 text-sm text-red-600">{fieldErrors.nip}</p>}
          </div>
        </div>
        <div>
          <label htmlFor="company-street" className="block text-sm font-medium text-gray-700">
            Ulica
          </label>
          <input
            id="company-street"
            type="text"
            value={street}
            onChange={(event) => setStreet(event.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {fieldErrors.street && <p className="mt-1 text-sm text-red-600">{fieldErrors.street}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="company-city" className="block text-sm font-medium text-gray-700">
              Miasto
            </label>
            <input
              id="company-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.city && <p className="mt-1 text-sm text-red-600">{fieldErrors.city}</p>}
          </div>
          <div>
            <label htmlFor="company-postal-code" className="block text-sm font-medium text-gray-700">
              Kod pocztowy
            </label>
            <input
              id="company-postal-code"
              type="text"
              value={postalCode}
              onChange={(event) => setPostalCode(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {fieldErrors.postalCode && <p className="mt-1 text-sm text-red-600">{fieldErrors.postalCode}</p>}
          </div>
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

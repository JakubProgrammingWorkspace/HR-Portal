import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '../api/client';
import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Clock, Download, FileText, Loader2, Send } from 'lucide-react';

const ITEMS_PER_PAGE = 30;

interface EmployeeOption {
  id: number;
  firstName: string;
  lastName: string;
}

interface FactorRow {
  id: number;
  name: string;
  description: string | null;
}

interface CategoryRow {
  id: number;
  code: string;
  name: string;
  sortOrder: number;
  factors: FactorRow[];
}

interface ReferralListItem {
  id: number;
  employee: string;
  examinationType: string;
  jobPosition: string;
  jobDescription: string;
  issuePlace: string;
  issueDate: string;
  pdfPath?: string;
  pdfGeneratedAt?: string;
}

const EXAMINATION_TYPES: { value: string; label: string }[] = [
  { value: 'wstepne', label: 'Wstępne' },
  { value: 'okresowe', label: 'Okresowe' },
  { value: 'kontrolne', label: 'Kontrolne' },
];

interface FieldErrors {
  employee?: string;
  examinationType?: string;
  jobPosition?: string;
  jobDescription?: string;
  issuePlace?: string;
  issueDate?: string;
}

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

function examinationTypeLabel(value: string): string {
  return EXAMINATION_TYPES.find((type) => type.value === value)?.label ?? value;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralListItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [generatingId, setGeneratingId] = useState<number | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([
      apiFetch('/api/employees').then(async (response) => {
        if (response.ok) {
          setEmployees((await response.json()) as EmployeeOption[]);
        }
      }),
      apiFetch('/api/exposure-categories').then(async (response) => {
        if (response.ok) {
          setCategories((await response.json()) as CategoryRow[]);
        }
      }),
    ]);
  }, []);

  useEffect(() => {
    void loadReferrals(page);
  }, [page]);

  async function loadReferrals(targetPage: number) {
    const response = await apiFetch(`/api/referrals?page=${targetPage}`);
    if (response.ok) {
      const data = (await response.json()) as ReferralListItem[];
      setReferrals(data);
      setHasNextPage(data.length === ITEMS_PER_PAGE);
    }
  }

  const employeeNames = useMemo(
    () => new Map(employees.map((employee) => [`/api/employees/${employee.id}`, `${employee.firstName} ${employee.lastName}`])),
    [employees]
  );

  function handleCreated(created: ReferralListItem) {
    if (page === 1) {
      setReferrals((prev) => [created, ...prev].slice(0, ITEMS_PER_PAGE));
    } else {
      setPage(1);
    }
  }

  async function handleGeneratePdf(id: number) {
    setPdfError(null);
    setGeneratingId(id);
    try {
      const response = await apiFetch(`/api/referrals/${id}/generate-pdf`, { method: 'POST' });
      if (!response.ok) {
        setPdfError(await extractErrorMessage(response));
        return;
      }
      const updated = (await response.json()) as ReferralListItem;
      setReferrals((prev) => prev.map((referral) => (referral.id === id ? updated : referral)));
    } finally {
      setGeneratingId(null);
    }
  }

  async function handleDownloadPdf(id: number) {
    setPdfError(null);
    const response = await apiFetch(`/api/referrals/${id}/pdf`);
    if (!response.ok) {
      setPdfError(await extractErrorMessage(response));
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `skierowanie-${id}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Skierowania</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Skierowania pracowników na badania lekarskie medycyny pracy.</p>
      </div>

      <NewReferralForm employees={employees} categories={categories} onCreated={handleCreated} />

      {pdfError && <p className="text-sm font-medium text-brand-rust">{pdfError}</p>}

      {/* Table grid */}
      <div className="overflow-hidden border border-slate-100 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
          <thead className="bg-white dark:bg-slate-900/80">
            <tr>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Pracownik</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Typ badania</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Stanowisko</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Data wystawienia</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Status PDF</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">Akcje</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {referrals.map((referral) => (
              <tr key={referral.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800 transition-colors">
                <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-white">
                  {employeeNames.get(referral.employee) ?? referral.employee}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{examinationTypeLabel(referral.examinationType)}</td>
                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{referral.jobPosition}</td>
                <td className="px-6 py-4 text-sm font-mono text-slate-500 dark:text-slate-400">{referral.issueDate.slice(0, 10)}</td>
                <td className="px-6 py-4 text-sm">
                  {referral.pdfGeneratedAt ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Wygenerowano
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      Nie wygenerowano
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {referral.pdfGeneratedAt ? (
                    <button
                      type="button"
                      onClick={() => void handleDownloadPdf(referral.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Pobierz PDF
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void handleGeneratePdf(referral.id)}
                      disabled={generatingId === referral.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-moss hover:bg-brand-moss-light text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                    >
                      {generatingId === referral.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                      Generuj PDF
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {referrals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-slate-400">
                  Brak skierowań.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="flex items-center justify-end gap-2 px-6 py-3 border-t border-slate-100 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Poprzednia
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">Strona {page}</span>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNextPage}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-50"
          >
            Następna
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

interface NewReferralFormProps {
  employees: EmployeeOption[];
  categories: CategoryRow[];
  onCreated: (created: ReferralListItem) => void;
}

function NewReferralForm({ employees, categories, onCreated }: NewReferralFormProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [examinationType, setExaminationType] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [issuePlace, setIssuePlace] = useState('');
  const [issueDate, setIssueDate] = useState(today());
  const [selectedFactors, setSelectedFactors] = useState<Map<number, string>>(new Map());
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleFactor(factorId: number, checked: boolean) {
    setSelectedFactors((prev) => {
      const next = new Map(prev);
      if (checked) {
        next.set(factorId, '');
      } else {
        next.delete(factorId);
      }
      return next;
    });
  }

  function setFactorDetails(factorId: number, value: string) {
    setSelectedFactors((prev) => new Map(prev).set(factorId, value));
  }

  function validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!employeeId) {
      errors.employee = 'Pracownik jest wymagany.';
    }
    if (!examinationType) {
      errors.examinationType = 'Typ badania jest wymagany.';
    }
    if (!jobPosition.trim()) {
      errors.jobPosition = 'Stanowisko pracy jest wymagane.';
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
      const exposureFactors = Array.from(selectedFactors.entries()).map(([factorId, exposureDetails]) => ({
        factor: `/api/exposure-factors/${factorId}`,
        exposureDetails,
      }));

      const response = await apiFetch('/api/referrals', {
        method: 'POST',
        body: JSON.stringify({
          employee: `/api/employees/${employeeId}`,
          examinationType,
          jobPosition,
          jobDescription,
          issuePlace,
          issueDate,
          exposureFactors,
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

      const created = (await response.json()) as ReferralListItem;
      onCreated(created);

      setEmployeeId('');
      setExaminationType('');
      setJobPosition('');
      setJobDescription('');
      setIssuePlace('');
      setIssueDate(today());
      setSelectedFactors(new Map());
      setFieldErrors({});
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="card-tactile p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700 shadow-md">
      <h2 className="text-lg font-bold text-slate-800 dark:text-white">Nowe skierowanie</h2>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="referral-employee" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Pracownik
            </label>
            <div className="relative mt-1">
              <select
                id="referral-employee"
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm appearance-none focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              >
                <option value="">Wybierz pracownika</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.firstName} {employee.lastName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
            {fieldErrors.employee && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.employee}</p>}
          </div>

          <div>
            <label htmlFor="referral-examination-type" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Typ badania
            </label>
            <div className="relative mt-1">
              <select
                id="referral-examination-type"
                value={examinationType}
                onChange={(event) => setExaminationType(event.target.value)}
                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm appearance-none focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              >
                <option value="">Wybierz typ badania</option>
                {EXAMINATION_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
            {fieldErrors.examinationType && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.examinationType}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="referral-job-position" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Stanowisko pracy
            </label>
            <input
              id="referral-job-position"
              type="text"
              value={jobPosition}
              onChange={(event) => setJobPosition(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {fieldErrors.jobPosition && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.jobPosition}</p>}
          </div>
          <div>
            <label htmlFor="referral-issue-place" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Miejsce wystawienia
            </label>
            <input
              id="referral-issue-place"
              type="text"
              value={issuePlace}
              onChange={(event) => setIssuePlace(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {fieldErrors.issuePlace && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.issuePlace}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="referral-job-description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Opis warunków pracy / zakres czynności
            </label>
            <textarea
              id="referral-job-description"
              rows={3}
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {fieldErrors.jobDescription && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.jobDescription}</p>}
          </div>
          <div>
            <label htmlFor="referral-issue-date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Data wystawienia
            </label>
            <input
              id="referral-issue-date"
              type="date"
              value={issueDate}
              onChange={(event) => setIssueDate(event.target.value)}
              className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            {fieldErrors.issueDate && <p className="mt-1 text-xs text-brand-rust font-medium">{fieldErrors.issueDate}</p>}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Czynniki narażenia</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4"
              >
                <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
                  {category.code}. {category.name}
                </h4>
                <ul className="space-y-2">
                  {category.factors.map((factor) => {
                    const checked = selectedFactors.has(factor.id);
                    return (
                      <li key={factor.id}>
                        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(event) => toggleFactor(factor.id, event.target.checked)}
                            className="rounded border-slate-300 dark:border-slate-700 text-brand-moss focus:ring-brand-moss/20"
                          />
                          {factor.name}
                        </label>
                        {checked && (
                          <input
                            type="text"
                            placeholder="Wielkość narażenia / wyniki pomiarów"
                            value={selectedFactors.get(factor.id) ?? ''}
                            onChange={(event) => setFactorDetails(factor.id, event.target.value)}
                            className="mt-1 ml-6 block w-[calc(100%-1.5rem)] rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
                          />
                        )}
                      </li>
                    );
                  })}
                  {category.factors.length === 0 && (
                    <li className="text-xs text-slate-400">Brak czynników w tej kategorii.</li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-brand-rust">{error}</p>}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-magnetic rounded-xl bg-brand-moss hover:bg-brand-moss-light text-white px-5 py-2.5 text-sm font-semibold hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? 'Zapisywanie...' : 'Utwórz skierowanie'}
          </button>
        </div>
      </form>
    </div>
  );
}

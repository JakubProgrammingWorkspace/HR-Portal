import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '../api/client';
import { Plus, Trash2, Shield, Eye, ShieldAlert, ChevronDown } from 'lucide-react';

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

export default function ExposureFactorsPage() {
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('/api/exposure-categories');
      if (!response.ok) {
        setError('Nie udało się wczytać danych.');
        return;
      }

      setCategories((await response.json()) as CategoryRow[]);
    } catch {
      setError('Nie udało się wczytać danych.');
    } finally {
      setLoading(false);
    }
  }

  function handleFactorAdded(categoryId: number, factor: FactorRow) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? { ...category, factors: [...category.factors, factor] }
          : category,
      ),
    );
  }

  function handleFactorRemoved(categoryId: number, factorId: number) {
    setCategories((prev) =>
      prev.map((category) =>
        category.id === categoryId
          ? { ...category, factors: category.factors.filter((factor) => factor.id !== factorId) }
          : category,
      ),
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Czynniki Narażeń</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Katalog czynników szkodliwych i niebezpiecznych w środowisku pracy.</p>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-4 py-2.5 text-sm font-medium text-brand-rust border border-red-200/20">{error}</p>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="shimmer h-48 w-full rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onFactorAdded={(factor) => handleFactorAdded(category.id, factor)}
              onFactorRemoved={(factorId) => handleFactorRemoved(category.id, factorId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CategoryCardProps {
  category: CategoryRow;
  onFactorAdded: (factor: FactorRow) => void;
  onFactorRemoved: (factorId: number) => void;
}

function CategoryCard({ category, onFactorAdded, onFactorRemoved }: CategoryCardProps) {
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(factor: FactorRow) {
    if (!window.confirm(`Czy na pewno usunąć czynnik "${factor.name}"?`)) {
      return;
    }

    setError(null);
    const response = await apiFetch(`/api/exposure-factors/${factor.id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError(await extractErrorMessage(response));
      return;
    }

    onFactorRemoved(factor.id);
  }

  return (
    <div className="card-tactile p-6 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-700 shadow-md flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-brand-moss/10 dark:bg-brand-moss/20 flex items-center justify-center text-brand-moss dark:text-brand-moss-light">
            <Shield className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-md font-bold text-slate-800 dark:text-white">
            {category.code}. {category.name}
          </h2>
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 dark:bg-red-950/20 px-3 py-2 text-xs font-semibold text-brand-rust mb-3">{error}</p>
        )}

        <ul className="divide-y divide-slate-100 dark:divide-slate-800 space-y-1">
          {category.factors.map((factor) => (
            <li key={factor.id} className="flex items-center justify-between gap-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">{factor.name}</p>
                {factor.description && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{factor.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(factor)}
                className="btn-magnetic p-1.5 rounded-lg bg-red-50 dark:bg-red-950/20 text-brand-rust hover:bg-brand-rust hover:text-white dark:hover:bg-brand-rust dark:hover:text-white transition-colors shrink-0"
                title="Usuń czynnik"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
          {category.factors.length === 0 && (
            <li className="py-4 text-center text-sm text-slate-400 font-medium">Brak czynników w tej kategorii.</li>
          )}
        </ul>
      </div>

      <AddFactorForm categoryId={category.id} onAdded={onFactorAdded} />
    </div>
  );
}

interface AddFactorFormProps {
  categoryId: number;
  onAdded: (factor: FactorRow) => void;
}

function AddFactorForm({ categoryId, onAdded }: AddFactorFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setNameError('Nazwa jest wymagana.');
      return;
    }
    setNameError(null);

    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/exposure-factors', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description: description.trim() ? description.trim() : null,
          category: `/api/exposure-categories/${categoryId}`,
        }),
      });

      if (!response.ok) {
        setError(await extractErrorMessage(response));
        return;
      }

      const created = (await response.json()) as FactorRow;
      onAdded(created);
      setName('');
      setDescription('');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="mt-6 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-4"
      onSubmit={handleSubmit}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor={`factor-name-${categoryId}`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Nazwa czynnika
          </label>
          <input
            id={`factor-name-${categoryId}`}
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
          {nameError && <p className="mt-1 text-[10px] text-brand-rust font-semibold">{nameError}</p>}
        </div>
        <div>
          <label htmlFor={`factor-description-${categoryId}`} className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
            Opis (opcjonalnie)
          </label>
          <input
            id={`factor-description-${categoryId}`}
            type="text"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>
      {error && <p className="text-xs text-brand-rust font-semibold">{error}</p>}
      
      <button
        type="submit"
        disabled={isSubmitting}
        className="btn-magnetic w-full rounded-xl bg-brand-moss hover:bg-brand-moss-light text-white py-2 text-xs font-semibold hover:shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
      >
        <Plus className="w-3.5 h-3.5" />
        {isSubmitting ? 'Dodawanie...' : 'Dodaj czynnik'}
      </button>
    </form>
  );
}


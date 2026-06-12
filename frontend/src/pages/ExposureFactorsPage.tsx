import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '../api/client';

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
    // ignore - fall through to the generic message below
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
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Czynniki narażeń</h1>
      <p className="mt-2 text-sm text-gray-600">Katalog czynników narażeń zawodowych.</p>

      {error && (
        <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-gray-600">Wczytywanie...</p>
      ) : (
        <div className="mt-6 space-y-6">
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
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-800">
        {category.code}. {category.name}
      </h2>

      {error && (
        <p className="mt-2 rounded-md bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <ul className="mt-4 divide-y divide-gray-200">
        {category.factors.map((factor) => (
          <li key={factor.id} className="flex items-center justify-between gap-4 py-2">
            <div>
              <p className="text-sm font-medium text-gray-800">{factor.name}</p>
              {factor.description && (
                <p className="text-sm text-gray-500">{factor.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleRemove(factor)}
              className="shrink-0 font-medium text-red-600 hover:text-red-800"
            >
              Usuń
            </button>
          </li>
        ))}
        {category.factors.length === 0 && (
          <li className="py-2 text-sm text-gray-500">Brak czynników.</li>
        )}
      </ul>

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
      className="mt-4 flex flex-wrap items-end gap-3 border-t border-gray-200 pt-4"
      onSubmit={handleSubmit}
    >
      <div className="min-w-[180px] flex-1">
        <label htmlFor={`factor-name-${categoryId}`} className="block text-sm font-medium text-gray-700">
          Nazwa
        </label>
        <input
          id={`factor-name-${categoryId}`}
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {nameError && <p className="mt-1 text-sm text-red-600">{nameError}</p>}
      </div>
      <div className="min-w-[180px] flex-1">
        <label htmlFor={`factor-description-${categoryId}`} className="block text-sm font-medium text-gray-700">
          Opis (opcjonalnie)
        </label>
        <input
          id={`factor-description-${categoryId}`}
          type="text"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
      >
        Dodaj czynnik
      </button>
    </form>
  );
}

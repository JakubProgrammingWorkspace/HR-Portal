import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError, login, setToken } from '../api/client';
import { ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token = await login(email, password);
      setToken(token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Nieprawidłowy e-mail lub hasło');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-brand-cream dark:bg-slate-950 transition-colors duration-300">
      {/* Left panel - Branding (Desktop only) */}
      <div className="hidden lg:flex lg:w-3/5 bg-brand-moss dark:bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Glow overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_60%)]"></div>
        
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md flex items-center justify-center font-bold">H</div>
          <span className="text-xl font-bold tracking-tight">HR-Portal</span>
        </div>

        <div className="max-w-md relative z-10 my-auto">
          <h1 className="text-4xl font-extrabold tracking-tight leading-none">
            Zarządzanie kadrami na wyższym poziomie.
          </h1>
          <p className="mt-4 text-slate-300 font-sans tracking-wide">
            Automatyzacja procesów HR, skierowania lekarskie, monitorowanie czynników szkodliwych oraz baza pracowników w jednym, bezpiecznym środowisku.
          </p>
        </div>

        <div className="flex items-center gap-2 relative z-10 text-xs text-slate-400 font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Zabezpieczone szyfrowaniem SSL/TLS</span>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md card-tactile p-8 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50 shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">Witaj ponownie</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Zaloguj się do swojego konta administracyjnego
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  E-mail
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="name@company.com"
                    className="pl-10 mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:focus:ring-brand-moss-light/20 transition-all dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Hasło
                </label>
                <div className="mt-1 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="pl-10 mt-1 block w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-2.5 text-sm shadow-sm focus:border-brand-moss focus:outline-none focus:ring-2 focus:ring-brand-moss/10 dark:focus:ring-brand-moss-light/20 transition-all dark:text-white"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-sm text-brand-rust font-medium bg-red-50 dark:bg-red-950/20 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-magnetic w-full rounded-xl bg-brand-moss hover:bg-brand-moss-light dark:bg-brand-moss dark:hover:bg-brand-moss-light px-4 py-2.5 text-sm font-semibold text-white hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Weryfikacja...' : 'Zaloguj się'}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}


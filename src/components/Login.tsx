import { useState } from 'react';
import {
  Eye,
  EyeOff,
  Lock,
  User,
  ChevronDown,
  Truck,
  Container,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import geosomLogoVertical from '../assets/branding/geosom-logo-vertical.png';

const logoAlt =
  'GEOSOM — Transformez vos décisions avec la technologie';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      setError(message || t('login.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3.5 text-slate-800 shadow-sm transition placeholder:text-slate-400 focus:border-brand-accent focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/25';

  return (
    <div className="relative flex min-h-screen flex-col bg-slate-100 font-sans antialiased">
      {/* Bandeau mobile : logo dans carte blanche */}
      <header className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white to-slate-50 lg:hidden">
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-brand-accent/10 blur-3xl" />
        <div className="relative px-5 pb-8 pt-10">
          <p className="mb-5 text-center text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-brand-navy/55">
            {t('login.sectorLabel')}
          </p>
          <div className="mx-auto flex max-w-[280px] justify-center">
            <div className="rounded-2xl bg-white p-6 shadow-card-lg ring-1 ring-slate-200/70">
              <img
                src={geosomLogoVertical}
                alt={logoAlt}
                className="mx-auto h-auto max-h-44 w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Colonne formulaire */}
        <div className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-10 sm:px-8 lg:w-1/2 lg:py-14 lg:pl-10 lg:pr-12">
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-100 via-white to-slate-50"
            aria-hidden
          />
          <Truck
            className="pointer-events-none absolute -left-6 bottom-8 h-52 w-52 text-brand-navy/[0.045] sm:h-64 sm:w-64 lg:-left-4 lg:bottom-12 lg:h-72 lg:w-72"
            strokeWidth={1}
            aria-hidden
          />
          <Container
            className="pointer-events-none absolute -right-2 top-24 h-40 w-40 text-brand-accent/[0.07] sm:top-16 sm:h-48 sm:w-48 lg:right-8 lg:top-28"
            strokeWidth={1}
            aria-hidden
          />

          <div className="relative w-full max-w-md">
            <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-8 shadow-card-lg backdrop-blur-sm sm:p-10">
              <div className="mb-8 text-center">
                <div className="mx-auto mb-5 h-1 w-14 rounded-full bg-gradient-to-r from-brand-accent via-amber-400 to-amber-500" />
                <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
                  {t('login.welcomeBack')}
                </h1>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  {t('login.continueMessage')}
                </p>
                <p className="mt-4 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {t('login.sectorLabel')}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {t('login.email')}
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="login-password"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    {t('login.password')}
                  </label>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-12`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                      aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-gradient-to-r from-brand-navy to-brand-navy-dark py-3.5 text-sm font-semibold text-white shadow-md shadow-brand-navy/25 transition hover:from-brand-navy-dark hover:to-[#0f1f35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? t('login.signingIn') : t('login.signIn')}
                </button>

                <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm">
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-slate-600 transition hover:text-brand-navy"
                  >
                    <Lock size={16} className="shrink-0 opacity-70" />
                    {t('login.forgotPassword')}
                  </button>
                  <button
                    type="button"
                    className="flex items-center gap-1.5 text-slate-600 transition hover:text-brand-navy"
                  >
                    <User size={16} className="shrink-0 opacity-70" />
                    {t('login.signInByKey')}
                  </button>
                </div>

                <div className="flex justify-center pt-1">
                  <div className="relative inline-block">
                    <select
                      aria-label="Language"
                      value={language}
                      onChange={(e) => setLanguage(e.target.value as 'en' | 'fr' | 'ar')}
                      className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-4 pr-10 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
                    >
                      <option value="en">{t('profile.english')}</option>
                      <option value="fr">{t('profile.french')}</option>
                      <option value="ar">{t('profile.arabic')}</option>
                    </select>
                    <ChevronDown
                      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                      aria-hidden
                    />
                  </div>
                </div>

                <p className="pt-1 text-center text-xs font-medium text-brand-navy/80">
                  {t('common.version')}
                </p>
              </form>
            </div>
          </div>
        </div>

        {/* Panneau marque desktop */}
        <div className="relative hidden min-h-0 flex-1 flex-col overflow-hidden lg:flex lg:w-1/2">
          <div
            className="absolute inset-0 bg-gradient-to-br from-brand-navy via-[#1a2d45] to-[#0c1524]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTTEwIDBoMXYxMEgweiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZykiLz48L3N2Zz4=')] opacity-45"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5"
            aria-hidden
          />
          <div className="pointer-events-none absolute right-10 top-10 opacity-[0.08] lg:right-16 lg:top-16">
            <Truck className="h-32 w-32 text-white" strokeWidth={0.75} aria-hidden />
          </div>

          <div className="relative flex flex-1 flex-col items-center justify-center px-8 py-14 lg:px-16">
            <div className="w-full max-w-[340px] rounded-3xl bg-white p-8 shadow-2xl shadow-black/35 ring-1 ring-white/20">
              <img
                src={geosomLogoVertical}
                alt={logoAlt}
                className="mx-auto h-auto max-h-[min(52vh,400px)] w-full max-w-[280px] object-contain"
              />
            </div>
            <p className="mt-8 text-center text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-white/50">
              {t('login.sectorLabel')}
            </p>
            <p className="sr-only">
              {t('login.title')}. {t('login.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200 bg-white py-4 text-center text-sm text-slate-500">
        2025© Geosom Technologies Solutions.
      </footer>
    </div>
  );
}



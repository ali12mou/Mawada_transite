import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import {
  registerConfirmHandler,
  type ConfirmOptions,
  type ConfirmVariant,
} from '../lib/appConfirm';

type DialogState = {
  open: boolean;
  message: string;
  options: ConfirmOptions;
  resolve: ((value: boolean) => void) | null;
};

const initial: DialogState = {
  open: false,
  message: '',
  options: {},
  resolve: null,
};

function variantStyles(variant: ConfirmVariant = 'danger') {
  if (variant === 'warning') {
    return {
      iconWrap: 'bg-amber-50 text-amber-600',
      Icon: AlertTriangle,
      confirmBtn: 'bg-[#EE964C] hover:bg-[#e08535] text-white',
    };
  }
  if (variant === 'default') {
    return {
      iconWrap: 'bg-slate-100 text-[#0F3C66]',
      Icon: AlertTriangle,
      confirmBtn: 'bg-[#0F3C66] hover:bg-[#0c3255] text-white',
    };
  }
  return {
    iconWrap: 'bg-red-50 text-red-600',
    Icon: Trash2,
    confirmBtn: 'bg-red-600 hover:bg-red-700 text-white',
  };
}

export function ConfirmDialogHost() {
  const { t } = useLanguage();
  const [state, setState] = useState<DialogState>(initial);

  const close = useCallback((value: boolean) => {
    setState((prev) => {
      prev.resolve?.(value);
      return initial;
    });
  }, []);

  useEffect(() => {
    registerConfirmHandler((message, options = {}) => {
      return new Promise<boolean>((resolve) => {
        setState({
          open: true,
          message,
          options,
          resolve,
        });
      });
    });
    return () => registerConfirmHandler(null);
  }, []);

  useEffect(() => {
    if (!state.open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state.open, close]);

  if (!state.open) return null;

  const variant = state.options.variant || 'danger';
  const styles = variantStyles(variant);
  const Icon = styles.Icon;
  const title =
    state.options.title ||
    (variant === 'warning'
      ? t('common.confirmTitle')
      : t('common.confirmDeleteTitle'));
  const confirmLabel =
    state.options.confirmLabel ||
    (variant === 'danger' ? t('common.delete') : t('common.confirmAction'));
  const cancelLabel = state.options.cancelLabel || t('common.cancel');

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
        onClick={() => close(false)}
        aria-hidden
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-desc"
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={() => close(false)}
          className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          aria-label={cancelLabel}
        >
          <X size={18} />
        </button>

        <div className="px-6 pb-6 pt-7">
          <div className="flex flex-col items-center text-center">
            <div
              className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${styles.iconWrap}`}
            >
              <Icon size={26} strokeWidth={2.25} />
            </div>
            <h2
              id="confirm-dialog-title"
              className="text-lg font-semibold text-slate-800"
            >
              {title}
            </h2>
            <p
              id="confirm-dialog-desc"
              className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600"
            >
              {state.message}
            </p>
          </div>

          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => close(false)}
              className="inline-flex min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              autoFocus
              className={`inline-flex min-w-[120px] items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition ${styles.confirmBtn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

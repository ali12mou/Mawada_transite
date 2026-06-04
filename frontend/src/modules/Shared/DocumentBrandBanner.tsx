import { useEffect, useState } from 'react';
import { fetchAppConfig } from '../../api/appConfigApi';
import { splitBrandLines } from '../../lib/documentPrintImages';
import { BrandingLogoMark } from './BrandingLogoMark';

/** Bandeau d'en-tête document : logo blanc + nom société sur fond bleu marine. */
export function DocumentBrandBanner({ className = '' }: { className?: string }) {
  const [lines, setLines] = useState({ line1: 'GEOSOM', line2: 'TECHNOLOGIE' });

  useEffect(() => {
    let cancelled = false;
    fetchAppConfig()
      .then((cfg) => {
        if (cancelled) return;
        setLines(splitBrandLines(cfg.company_name || 'GEOSOM TECHNOLOGIE'));
      })
      .catch(() => {
        /* valeurs par défaut */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header
      className={`flex items-center gap-3.5 rounded-[10px] bg-[#0F3C66] px-4 py-3 text-white ${className}`}
    >
      <BrandingLogoMark className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white" />
      <div className="text-left leading-tight">
        <div className="text-[15px] font-extrabold uppercase tracking-wide">{lines.line1}</div>
        {lines.line2 ? (
          <div className="text-[15px] font-extrabold uppercase tracking-wide">{lines.line2}</div>
        ) : null}
      </div>
    </header>
  );
}

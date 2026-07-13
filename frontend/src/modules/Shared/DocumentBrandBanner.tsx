import { useEffect, useState } from 'react';
import { fetchAppConfig } from '../../api/appConfigApi';
import { splitBrandLines } from '../../lib/documentPrintImages';
import { BrandingLogoMark } from './BrandingLogoMark';

type DocumentBrandBannerProps = {
  className?: string;
  /** `blue` = bandeau bleu marine ; `plain` = logo + nom sans fond coloré. */
  variant?: 'blue' | 'plain';
};

/** Bandeau d'en-tête document : logo + nom société (fond bleu ou neutre). */
export function DocumentBrandBanner({ className = '', variant = 'blue' }: DocumentBrandBannerProps) {
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

  const isPlain = variant === 'plain';

  return (
    <header
      className={
        isPlain
          ? `flex items-center gap-3.5 border-b border-[#00B0F0] pb-3 ${className}`
          : `flex items-center gap-3.5 rounded-[10px] bg-[#0F3C66] px-4 py-3 text-white ${className}`
      }
    >
      <BrandingLogoMark
        className={
          isPlain
            ? 'flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden'
            : 'flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white'
        }
      />
      <div className="text-left leading-tight">
        <div
          className={`text-[15px] font-extrabold uppercase tracking-wide ${
            isPlain ? 'text-[#00AA48]' : ''
          }`}
        >
          {lines.line1}
        </div>
        {lines.line2 ? (
          <div
            className={`text-[15px] font-extrabold uppercase tracking-wide ${
              isPlain ? 'text-[#0F3C66]' : ''
            }`}
          >
            {lines.line2}
          </div>
        ) : null}
      </div>
    </header>
  );
}

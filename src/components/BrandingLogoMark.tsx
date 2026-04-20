import { useEffect, useState } from 'react';
import { Truck } from 'lucide-react';
import { fetchAppConfig } from '../api/appConfigApi';
import { getAppLogoSrcFromConfig } from '../lib/brandingLogo';
/** Logo compact (carré blanc, pictogramme GEOSOM) pour barre latérale et cartes */
import defaultGeosomLogoMark from '../assets/branding/geosom-logo-mark.png';
import defaultGeosomLogoVertical from '../assets/branding/geosom-logo-vertical.png';
import defaultGeosomLogoSvg from '../assets/branding/geosom-logo.svg';

type BrandingLogoMarkProps = {
  /** Conteneur (Tailwind), ex. w-10 h-10 rounded-lg */
  className?: string;
  /** Classes pour la balise img */
  imgClassName?: string;
  /** Taille de l’icône camion si aucune image ne charge */
  iconSize?: number;
};

/**
 * Logo à côté du nom : images Paramètres (footer / en-tête) si définies,
 * sinon logo GEOSOM officiel (PNG), puis SVG intégré, sinon icône camion.
 */
export function BrandingLogoMark({ className, imgClassName, iconSize = 24 }: BrandingLogoMarkProps) {
  const [src, setSrc] = useState<string>(defaultGeosomLogoMark);
  const [useTruck, setUseTruck] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchAppConfig()
      .then((cfg) => {
        if (cancelled) return;
        const u = getAppLogoSrcFromConfig(cfg);
        if (u) setSrc(u);
      })
      .catch(() => {
        /* garde le logo GEOSOM compact par défaut */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const boxClass =
    className ||
    'w-10 h-10 shrink-0 bg-white rounded-lg flex items-center justify-center overflow-hidden';

  return (
    <div className={boxClass}>
      {useTruck ? (
        <Truck className="text-[#1e3a5f]" size={iconSize} aria-hidden />
      ) : (
        <img
          src={src}
          alt="GEOSOM — Transformez vos décisions avec la technologie"
          className={imgClassName || 'max-w-full max-h-full w-full h-full object-contain p-1'}
          onError={() => {
            setSrc((prev) => {
              if (prev !== defaultGeosomLogoMark && prev !== defaultGeosomLogoVertical && prev !== defaultGeosomLogoSvg) {
                return defaultGeosomLogoMark;
              }
              if (prev === defaultGeosomLogoMark) return defaultGeosomLogoVertical;
              if (prev === defaultGeosomLogoVertical) return defaultGeosomLogoSvg;
              setUseTruck(true);
              return prev;
            });
          }}
        />
      )}
    </div>
  );
}

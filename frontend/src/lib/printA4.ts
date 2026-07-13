/**
 * Mise en page A4 pour impression physique et export PDF via le navigateur
 * (Imprimer → « Enregistrer au format PDF » : la cible reste A4 grâce à @page).
 */

export const STYLE_A4_SHEET = `
    /* Format page PDF / imprimante : A4 strict */
    @page {
      size: A4 portrait;
      margin: 12mm 14mm;
    }
    html {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      html, body {
        width: 210mm !important;
        margin: 0 !important;
        padding: 0 !important;
      }
    }
    @media screen {
      html {
        background: #d8d8d8;
      }
      body {
        width: 210mm;
        min-height: 297mm;
        margin: 14px auto !important;
        padding: 12mm 14mm;
        box-sizing: border-box;
        box-shadow: 0 2px 14px rgba(0, 0, 0, 0.15);
        background: #fff;
      }
    }
`;

/** Ouvre la boîte d’impression (PDF ou imprimante) une fois la page et les images chargées. */
export const SCRIPT_AUTO_PRINT = `
<script>
(function () {
  var printed = false;
  function doPrint() {
    if (printed) return;
    printed = true;
    try { window.focus(); window.print(); } catch (e) {}
  }
  function whenImagesReady(cb) {
    var imgs = document.images;
    if (!imgs || imgs.length === 0) { cb(); return; }
    var pending = 0;
    function tick() { if (--pending <= 0) cb(); }
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete) continue;
      pending++;
      imgs[i].addEventListener('load', tick, { once: true });
      imgs[i].addEventListener('error', tick, { once: true });
    }
    if (pending === 0) cb();
    else setTimeout(cb, 4000);
  }
  function schedule() {
    whenImagesReady(function () { setTimeout(doPrint, 300); });
  }
  if (document.readyState === 'complete') schedule();
  else window.addEventListener('load', schedule);
})();
</script>`;

export function appendAutoPrintBeforeBodyClose(html: string): string {
  if (html.includes('</body>')) {
    return html.replace('</body>', `${SCRIPT_AUTO_PRINT}\n</body>`);
  }
  return html + SCRIPT_AUTO_PRINT;
}

/**
 * Lance l’export PDF via la boîte d’impression du navigateur (destination « Enregistrer au format PDF »),
 * sans ouvrir d’onglet HTML visible.
 */
export function openHtmlForPdfExport(html: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;opacity:0;pointer-events:none';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  if (!win) {
    document.body.removeChild(iframe);
    openHtmlPrintPopup(html);
    return;
  }

  win.document.open();
  win.document.write(appendAutoPrintBeforeBodyClose(html));
  win.document.close();

  const cleanup = () => {
    try {
      document.body.removeChild(iframe);
    } catch {
      /* déjà retiré */
    }
  };
  win.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, 120_000);
}

/** Fallback : fenêtre pop-up avec impression automatique (PDF via le navigateur). */
export function openHtmlPrintPopup(html: string): void {
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour exporter en PDF.');
    return;
  }
  w.document.open();
  w.document.write(appendAutoPrintBeforeBodyClose(html));
  w.document.close();
}



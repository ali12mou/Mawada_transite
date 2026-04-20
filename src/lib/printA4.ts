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

/** Ouvre la boîte d’impression (PDF ou imprimante) une fois la page chargée — format A4 défini par le CSS. */
export const SCRIPT_AUTO_PRINT = `
<script>
(function () {
  function printWhenReady() {
    try {
      window.focus();
      window.print();
    } catch (e) {}
  }
  function schedule() {
    setTimeout(printWhenReady, 450);
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

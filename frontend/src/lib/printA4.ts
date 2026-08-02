/**
 * Mise en page A4 pour impression et enregistrement PDF via le navigateur.
 */

import { injectPreviewToolbar, openHtmlBlobInBrowser, openHtmlPrintThenPdfInBrowser } from './htmlPrintPdf';

export const STYLE_A4_SHEET = `
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

export function appendAutoPrintBeforeBodyClose(html: string, pdfFileName = 'document.pdf'): string {
  const clean = injectPreviewToolbar(html, pdfFileName);
  if (clean.includes('</body>')) {
    return clean.replace('</body>', `${SCRIPT_AUTO_PRINT}\n</body>`);
  }
  return clean + SCRIPT_AUTO_PRINT;
}

export function openHtmlForPdfExport(html: string, pdfFileName = 'document.pdf'): void {
  void openHtmlPrintThenPdfInBrowser(html, pdfFileName);
}

export function openHtmlPrintPopup(html: string, pdfFileName = 'document.pdf'): void {
  const w = window.open('', '_blank', 'width=900,height=1200');
  if (!w) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }
  openHtmlBlobInBrowser(html, w, pdfFileName);
  setTimeout(() => {
    try {
      w.focus();
      w.print();
    } catch {
      /* ignore */
    }
  }, 600);
}

/**
 * Comportement d’origine :
 * - ouvre le document HTML (bonne forme)
 * - lance l’impression
 * Sans boutons « Télécharger » / « Imprimer » dans le fichier.
 */

function waitForDocumentImages(doc: Document, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve) => {
    const imgs = Array.from(doc.images);
    if (imgs.length === 0) {
      resolve();
      return;
    }
    let pending = 0;
    const done = () => {
      if (--pending <= 0) resolve();
    };
    for (const img of imgs) {
      if (img.complete && img.naturalWidth > 0) continue;
      pending++;
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }
    if (pending === 0) resolve();
    else setTimeout(resolve, timeoutMs);
  });
}

function waitForWindowLoad(win: Window): Promise<void> {
  if (win.document.readyState === 'complete') return Promise.resolve();
  return new Promise((resolve) => win.addEventListener('load', () => resolve(), { once: true }));
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function safeFileName(name: string): string {
  const base = (name || 'document.pdf').trim() || 'document.pdf';
  return base.toLowerCase().endsWith('.pdf') ? base : `${base}.pdf`;
}

/** Retire toute barre d’outils injectée (Télécharger / Imprimer). */
export function injectPreviewToolbar(html: string, _pdfFileName = 'document.pdf'): string {
  return html
    .replace(/<style id="mawada-print-chrome-style">[\s\S]*?<\/style>/gi, '')
    .replace(/<div id="mawada-print-chrome">[\s\S]*?<\/div>/gi, '')
    .replace(/<script id="mawada-print-chrome-script">[\s\S]*?<\/script>/gi, '')
    .replace(/<style id="doc-preview-toolbar-style">[\s\S]*?<\/style>/gi, '')
    .replace(/<div id="doc-preview-toolbar">[\s\S]*?<\/div>/gi, '')
    .replace(/<script id="doc-preview-toolbar-script">[\s\S]*?<\/script>/gi, '');
}

/** Affiche le HTML dans la fenêtre cible (sans boutons). */
export function openHtmlBlobInBrowser(
  html: string,
  target: Window,
  pdfFileName = 'document.pdf'
): void {
  const clean = injectPreviewToolbar(html, pdfFileName);
  target.document.open();
  target.document.write(clean);
  target.document.close();
  target.document.title = safeFileName(pdfFileName).replace(/\.pdf$/i, '');
}

/**
 * Ouvre le document HTML puis la boîte d’impression (sans boutons dans le fichier).
 */
export async function openHtmlPrintThenPdfInBrowser(
  html: string,
  pdfFileName = 'document.pdf'
): Promise<void> {
  const printWin = window.open('', '_blank', 'width=900,height=1200');
  if (!printWin) {
    alert('Autorisez les fenêtres pop-up pour imprimer.');
    return;
  }

  openHtmlBlobInBrowser(html, printWin, pdfFileName);

  await waitForWindowLoad(printWin);
  await waitForDocumentImages(printWin.document);
  await delay(400);

  try {
    printWin.focus();
    printWin.print();
  } catch (err) {
    console.error(err);
  }
}

/** Ouvre le document HTML sans barre d’outils. */
export async function openHtmlAsPdfInBrowser(
  html: string,
  pdfFileName = 'document.pdf'
): Promise<Window | null> {
  const win = window.open('', '_blank', 'width=900,height=1200');
  if (!win) {
    alert('Autorisez les fenêtres pop-up pour ouvrir le document.');
    return null;
  }
  openHtmlBlobInBrowser(html, win, pdfFileName);
  await waitForWindowLoad(win);
  await waitForDocumentImages(win.document);
  return win;
}

export async function openHtmlPreviewWithDownload(
  html: string,
  pdfFileName = 'document.pdf'
): Promise<void> {
  await openHtmlAsPdfInBrowser(html, pdfFileName);
}

export async function downloadHtmlAsPdf(
  html: string,
  pdfFileName = 'document.pdf'
): Promise<void> {
  await openHtmlPrintThenPdfInBrowser(html, pdfFileName);
}

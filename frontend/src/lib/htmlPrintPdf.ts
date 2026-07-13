function waitForDocumentImages(doc: Document, timeoutMs = 5000): Promise<void> {
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
      if (img.complete) continue;
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

/** Ouvre le même document HTML via une URL `blob:` (rendu identique à l’impression). */
export function openHtmlBlobInBrowser(html: string, target: Window): void {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  target.location.href = blobUrl;
  setTimeout(() => URL.revokeObjectURL(blobUrl), 300_000);
}

/**
 * 1. Ouvre le document et affiche la boîte d’impression.
 * 2. Après impression ou annulation, rouvre le même fichier HTML via `blob:`
 *    pour un rendu identique au document imprimé.
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

  printWin.document.open();
  printWin.document.write(html);
  printWin.document.close();
  printWin.document.title = pdfFileName.replace(/\.pdf$/i, '');

  await waitForWindowLoad(printWin);
  await waitForDocumentImages(printWin.document);
  await new Promise((r) => setTimeout(r, 400));

  let reopened = false;

  const reopenSameDocument = () => {
    if (reopened) return;
    reopened = true;
    openHtmlBlobInBrowser(html, printWin);
  };

  printWin.addEventListener('afterprint', reopenSameDocument, { once: true });

  printWin.focus();
  printWin.print();

  // Après fermeture de la boîte d’impression (imprimer ou annuler).
  reopenSameDocument();
}

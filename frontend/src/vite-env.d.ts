/// <reference types="vite/client" />

declare module 'html2pdf.js' {
  interface Html2PdfOptions {
    margin?: number | number[];
    filename?: string;
    image?: { type?: string; quality?: number };
    html2canvas?: Record<string, unknown>;
    jsPDF?: Record<string, unknown>;
    pagebreak?: { mode?: string | string[] };
  }
  interface Html2PdfWorker {
    set(options: Html2PdfOptions): Html2PdfWorker;
    from(element: HTMLElement): Html2PdfWorker;
    outputPdf(type: 'blob'): Promise<Blob>;
    save(): Promise<void>;
  }
  function html2pdf(): Html2PdfWorker;
  export default html2pdf;
}

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  /** Port du backend Express si l’URL complète n’est pas dans VITE_API_URL (défaut 4000). */
  readonly VITE_API_PORT?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}




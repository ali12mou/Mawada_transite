import { useMemo, useState } from 'react';
import { Eye, FilePenLine, Plus, Printer, Search, Trash2, X } from 'lucide-react';
import { fetchDocumentBranding } from '../../../lib/documentBranding';
import { buildLetterheadHtml } from '../../../lib/documentPrintImages';
import { appendAutoPrintBeforeBodyClose, STYLE_A4_SHEET } from '../../../lib/printA4';
import type { DocumentBranding } from '../../../types/documentBranding';

type OtherProfitRow = {
  id: number;
  name: string;
  phone: string;
  creditAdvance: boolean;
  creditFunding: boolean;
  date: string;
  amountDjf: number;
  amountUsd: number;
  documentName?: string;
  description?: string;
  destination?: string;
  transportType?: string;
  productOfOrigin?: string;
  declarationForm?: string;
  tinNo?: string;
  hsCode?: string;
  mt?: string;
  grossWt?: string;
};

const seedRows: OtherProfitRow[] = [
  {
    id: 1,
    name: 'MOHAMED ABDOU MOH',
    phone: '+251911250024',
    creditAdvance: false,
    creditFunding: true,
    date: '2026-06-01',
    amountDjf: 2848000,
    amountUsd: 16000,
    documentName: '',
    description: 'SINO TRUCK CARGO CLASS',
    destination: 'ADDIS ABEBA , ETHIOPIA',
    transportType: 'TRUCK',
    productOfOrigin: 'CHINA',
    declarationForm: 'ABDIKARIM',
    tinNo: '0094463053',
    hsCode: '1254545656',
    mt: '270',
    grossWt: '12970',
  },
];

function formatMoney(v: number): string {
  return `${v.toFixed(2)}`;
}

type FormState = {
  name: string;
  phone: string;
  creditAdvance: '' | 'yes' | 'no';
  creditFunding: '' | 'yes' | 'no';
  date: string;
  amountDjf: string;
  amountUsd: string;
  documentFile: File | null;
  documentName: string;
};

const initialFormState: FormState = {
  name: '',
  phone: '',
  creditAdvance: '',
  creditFunding: '',
  date: '',
  amountDjf: '0',
  amountUsd: '0',
  documentFile: null,
  documentName: '',
};

export function OtherProfitTransitModule() {
  const [query, setQuery] = useState('');
  const [rowsData, setRowsData] = useState<OtherProfitRow[]>(seedRows);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [formError, setFormError] = useState('');
  const [viewRow, setViewRow] = useState<OtherProfitRow | null>(null);
  const [editingRowId, setEditingRowId] = useState<number | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rowsData;
    return rowsData.filter(
      row => row.name.toLowerCase().includes(q) || row.phone.toLowerCase().includes(q)
    );
  }, [query, rowsData]);

  const totalDjf = rows.reduce((sum, row) => sum + row.amountDjf, 0);
  const totalUsd = rows.reduce((sum, row) => sum + row.amountUsd, 0);

  const openCreateModal = () => {
    setForm(initialFormState);
    setFormError('');
    setStep(1);
    setEditingRowId(null);
    setShowModal(true);
  };

  const openEditModal = (row: OtherProfitRow) => {
    setForm({
      name: row.name,
      phone: row.phone,
      creditAdvance: row.creditAdvance ? 'yes' : 'no',
      creditFunding: row.creditFunding ? 'yes' : 'no',
      date: row.date,
      amountDjf: String(row.amountDjf),
      amountUsd: String(row.amountUsd),
      documentFile: null,
      documentName: row.documentName || '',
    });
    setFormError('');
    setStep(1);
    setEditingRowId(row.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setStep(1);
    setFormError('');
    setEditingRowId(null);
  };

  const goToStepTwo = () => {
    const hasMissingRequiredFields =
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.creditAdvance ||
      !form.creditFunding ||
      !form.date;
    if (hasMissingRequiredFields) {
      setFormError('Veuillez renseigner tous les champs obligatoires avant de continuer.');
      return;
    }
    setFormError('');
    setStep(2);
  };

  const handleCreate = () => {
    const parsedDjf = Number(form.amountDjf || 0);
    const parsedUsd = Number(form.amountUsd || 0);
    const resolvedDocumentName = form.documentFile?.name || form.documentName || '';

    if (editingRowId !== null) {
      setRowsData(prev =>
        prev.map(row =>
          row.id === editingRowId
            ? {
                ...row,
                name: form.name.trim(),
                phone: form.phone.trim(),
                creditAdvance: form.creditAdvance === 'yes',
                creditFunding: form.creditFunding === 'yes',
                date: form.date,
                amountDjf: Number.isFinite(parsedDjf) ? parsedDjf : 0,
                amountUsd: Number.isFinite(parsedUsd) ? parsedUsd : 0,
                documentName: resolvedDocumentName,
              }
            : row
        )
      );
    } else {
      const newRow: OtherProfitRow = {
        id: rowsData.length ? Math.max(...rowsData.map(x => x.id)) + 1 : 1,
        name: form.name.trim(),
        phone: form.phone.trim(),
        creditAdvance: form.creditAdvance === 'yes',
        creditFunding: form.creditFunding === 'yes',
        date: form.date,
        amountDjf: Number.isFinite(parsedDjf) ? parsedDjf : 0,
        amountUsd: Number.isFinite(parsedUsd) ? parsedUsd : 0,
        documentName: resolvedDocumentName,
      };
      setRowsData(prev => [newRow, ...prev]);
    }
    closeModal();
  };

  const escapeHtml = (value: string): string =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  const splitPhones = (phone: string): { mob: string; tel: string } => {
    const raw = (phone || '').trim();
    if (!raw) return { mob: '—', tel: '—' };
    const parts = raw
      .split(/\||\/|\n|;|(?:\s{2,})/)
      .map(s => s.replace(/^(mob|tel|tél|phone)\s*:\s*/i, '').trim())
      .filter(Boolean);
    if (parts.length >= 2) return { mob: parts[0], tel: parts[1] };
    return { mob: raw, tel: '—' };
  };

  const buildPrintDocumentHtml = (row: OtherProfitRow, branding: DocumentBranding): string => {
    const amountDjf = formatMoney(row.amountDjf);
    const amountUsd = formatMoney(row.amountUsd);
    const letterhead = buildLetterheadHtml(branding);
    const companyName = (branding.companyName || 'GEOSOM TRANSIT').trim();
    const { mob, tel } = splitPhones(branding.companyPhone);
    const address = (branding.companyAddress || '—').trim();
    const email = (branding.companyEmail || '—').trim();

    return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(companyName)} - Other Profit Details - ${escapeHtml(row.name)}</title>
  <style>
    ${STYLE_A4_SHEET}
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 0; font-size: 11px; }
    .sheet { padding: 4px 8px; min-height: 100vh; }
    .letterhead { text-align: center; margin-bottom: 14px; }
    .letterhead img { max-height: 92px; width: 100%; object-fit: contain; }
    .meta-top { display: flex; justify-content: space-between; align-items: center; font-size: 10px; color: #111827; margin: 0 0 8px; }
    .brand-bar {
      background: #0f3c66;
      color: #fff;
      border-radius: 4px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      margin-bottom: 10px;
    }
    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 8px;
      background: #fff;
      object-fit: contain;
      padding: 4px;
    }
    .brand-icon {
      width: 34px;
      height: 34px;
      border-radius: 6px;
      background: #ffffff;
      color: #0f3c66;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
    }
    .brand { font-weight: 800; letter-spacing: .02em; line-height: 1.05; font-size: 14px; text-transform: uppercase; }
    .title { text-align: center; font-weight: 700; margin: 8px 0 4px; font-size: 40px; }
    .meta-center { text-align: center; font-size: 12px; color: #4b5563; margin-bottom: 2px; }
    .meta-center-strong { text-align: center; font-size: 12px; margin-bottom: 2px; font-weight: 700; }
    .summary {
      display: grid;
      grid-template-columns: 1.3fr .7fr;
      gap: 12px 20px;
      margin: 16px 4px 14px;
      font-size: 11px;
    }
    .summary .left > div,
    .summary .right > div { margin: 0 0 5px; }
    .pct-box { display: flex; align-items: center; justify-content: flex-end; min-height: 70px; }
    .pct-text { font-size: 40px; font-weight: 800; color: #111827; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 11px; }
    th, td { border-bottom: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
    thead th {
      background: linear-gradient(180deg, #ee964c 0%, #d35400 100%);
      color: #fff;
      border-bottom: none;
      font-weight: 700;
    }
    thead th.num, td.num { text-align: right; }
    .totals td {
      background: linear-gradient(180deg, #ee964c 0%, #d35400 100%);
      color: #fff;
      font-weight: 700;
      border-bottom: none;
    }
    .note { margin-top: 14px; font-style: italic; font-size: 10px; color: #6b7280; }
    .signature { margin-top: 28px; font-size: 11px; }
    .stamp { margin-top: 10px; border: 2px solid #2563eb; color: #2563eb; display: inline-block; padding: 7px 11px; font-weight: 700; font-size: 9px; }
    .footer { margin-top: 28px; border-top: 3px solid #ee964c; padding-top: 8px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; font-weight: 600; }
    @media print {
      .sheet { border: none; padding: 0; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="meta-top">
      <div>${escapeHtml(new Date().toLocaleString('fr-FR'))}</div>
      <div>Other Profit Detail — ${escapeHtml(companyName)}</div>
      <div></div>
    </div>
    ${letterhead}
    <div class="title">OTHER PROFIT DETAILS</div>
    <div class="meta-center">Djibouti, ${escapeHtml(new Date().toLocaleDateString('fr-FR'))}</div>
    <div class="meta-center-strong">Client: ${escapeHtml(row.name || '-')}</div>
    <div class="meta-center-strong">Responsible: ${escapeHtml(row.declarationForm || 'N/A')}</div>

    <div class="summary">
      <div class="left">
        <div><strong>Description of goods:</strong> ${escapeHtml(row.description || '-')}</div>
        <div><strong>Quantity:</strong> 1.00</div>
        <div><strong>Tel (Phone):</strong> ${escapeHtml(row.phone)}</div>
        <div><strong>Date:</strong> ${escapeHtml(row.date || '-')}</div>
        <div><strong>TIN No:</strong> ${escapeHtml(row.tinNo || '-')}</div>
        <div><strong>HS Code:</strong> ${escapeHtml(row.hsCode || '-')}</div>
        <div><strong>Destination:</strong> ${escapeHtml(row.destination || '-')}</div>
      </div>
      <div class="right">
        <div class="pct-box"><div class="pct-text">Percentage 3%</div></div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Field</th><th>Value</th></tr>
      </thead>
      <tbody>
        <tr><td>Name</td><td>${escapeHtml(row.name)}</td></tr>
        <tr><td>Phone Number</td><td>${escapeHtml(row.phone)}</td></tr>
        <tr><td>Credit Advance</td><td>${row.creditAdvance ? 'yes' : 'no'}</td></tr>
        <tr><td>Credit Finance</td><td>${row.creditFunding ? 'yes' : 'no'}</td></tr>
        <tr><td>Date</td><td>${escapeHtml(row.date || '-')}</td></tr>
        <tr><td>Document</td><td>${escapeHtml(row.documentName || 'N/A')}</td></tr>
      </tbody>
    </table>

    <table style="margin-top: 16px;">
      <thead>
        <tr><th>Details</th><th class="num">DJF</th><th class="num">USD</th></tr>
      </thead>
      <tbody>
        <tr><td>Amount</td><td class="num">${escapeHtml(amountDjf)} Fdj</td><td class="num">$${escapeHtml(amountUsd)}</td></tr>
        <tr><td>Rate Amount</td><td class="num">178.00 Fdj</td><td class="num">1 USD</td></tr>
        <tr class="totals"><td>Total amount DJF/USD</td><td class="num">${escapeHtml(amountDjf)} Fdj</td><td class="num">$${escapeHtml(amountUsd)}</td></tr>
      </tbody>
    </table>

    <div class="note">Note: This Other Profit record contains optional financial and document information.</div>

    <div class="signature">
      <strong>Signature:</strong> __________________
      <div class="stamp">${escapeHtml(companyName.toUpperCase())}</div>
    </div>

    <div class="footer">
      <div>Mob: ${escapeHtml(mob)}<br />TEL: ${escapeHtml(tel)}</div>
      <div>Adresse: ${escapeHtml(address)}<br />Email: ${escapeHtml(email)}</div>
    </div>
  </div>
</body>
</html>`;
  };

  const printRowDocument = async (row: OtherProfitRow) => {
    const branding = await fetchDocumentBranding();
    const popup = window.open('', '_blank', 'width=1000,height=900');
    if (!popup) {
      alert('Autorisez les fenêtres pop-up pour imprimer.');
      return;
    }
    popup.document.open();
    popup.document.write(appendAutoPrintBeforeBodyClose(buildPrintDocumentHtml(row, branding)));
    popup.document.close();
  };

  const openViewModal = (row: OtherProfitRow) => {
    setViewRow(row);
  };

  const closeViewModal = () => {
    setViewRow(null);
  };

  const viewFields: Array<{ label: string; value: string }> = viewRow
    ? [
        { label: 'Client', value: viewRow.name || '-' },
        { label: 'Description', value: viewRow.description || '-' },
        { label: 'Destination', value: viewRow.destination || '-' },
        { label: 'Type de transport', value: viewRow.transportType || '-' },
        { label: 'ProductOfOrigin', value: viewRow.productOfOrigin || '-' },
        { label: 'DeclarationForm', value: viewRow.declarationForm || '-' },
        { label: 'TIN No', value: viewRow.tinNo || '-' },
        { label: 'Tel', value: viewRow.phone || '-' },
        { label: 'HS Code', value: viewRow.hsCode || '-' },
        { label: 'MT', value: viewRow.mt || '-' },
        { label: 'Gross WT', value: viewRow.grossWt || '-' },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#0F3C66]">
          Gérer la liste des autres bénéfices
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0F3C66] px-4 py-2 text-sm text-white transition hover:bg-[#154b8a]"
          >
            <Plus size={16} />
            Ajouter Nouveau
          </button>
          <button
            type="button"
            onClick={() => {
              if (rowsData[0]) printRowDocument(rowsData[0]);
            }}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-[#0F3C66] transition hover:bg-gray-50"
          >
            <Printer size={16} />
            Imprimer
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <label className="mb-2 block text-sm font-medium text-gray-700">Rechercher</label>
        <div className="relative max-w-md">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search autres profit..."
            className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[#0F3C66]"
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Nom</th>
                <th className="px-3 py-2 text-left">Numéro de téléphone</th>
                <th className="px-3 py-2 text-left">Avance de crédit</th>
                <th className="px-3 py-2 text-left">Financement de crédit</th>
                <th className="px-3 py-2 text-left">Montant DJF</th>
                <th className="px-3 py-2 text-left">Montant $</th>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Document</th>
                <th className="px-3 py-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-6 text-center text-gray-500">
                    Aucun résultat.
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id} className="border-t">
                    <td className="px-3 py-2">{row.id}</td>
                    <td className="px-3 py-2">{row.name}</td>
                    <td className="px-3 py-2">{row.phone}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.creditAdvance
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {row.creditAdvance ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          row.creditFunding
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {row.creditFunding ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-medium">{formatMoney(row.amountDjf)}</td>
                    <td className="px-3 py-2 font-medium">{formatMoney(row.amountUsd)}</td>
                    <td className="px-3 py-2">{row.date || '-'}</td>
                    <td className="px-3 py-2">{row.documentName || '-'}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2 text-gray-600">
                        <button
                          type="button"
                          onClick={() => openViewModal(row)}
                          className="hover:text-[#0F3C66]"
                          title="Voir"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="hover:text-[#0F3C66]"
                          title="Modifier"
                        >
                          <FilePenLine size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => printRowDocument(row)}
                          className="hover:text-[#0F3C66]"
                          title="Imprimer"
                        >
                          <Printer size={14} />
                        </button>
                        <button type="button" className="hover:text-red-600" title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
              <tr className="border-t bg-gray-50 font-semibold">
                <td className="px-3 py-2" colSpan={5}>
                  Total
                </td>
                <td className="px-3 py-2">{formatMoney(totalDjf)}</td>
                <td className="px-3 py-2">{formatMoney(totalUsd)}</td>
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
                <td className="px-3 py-2" />
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-2xl font-semibold text-[#0F3C66]">
                {editingRowId !== null ? 'Modifier Other Profit' : 'Add/Update Other Profit'}
              </h2>
              <button type="button" onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6 p-6">
              <div className="flex items-center justify-center gap-4">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    step === 1 ? 'bg-[#0F3C66] text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  1
                </div>
                <div className="h-0.5 w-14 bg-gray-300" />
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                    step === 2 ? 'bg-[#0F3C66] text-white' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  2
                </div>
              </div>

              {step === 1 ? (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Nom</label>
                      <input
                        value={form.name}
                        onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Enter name"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Numéro de téléphone
                      </label>
                      <input
                        value={form.phone}
                        onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="Enter phone number"
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Avance de crédit
                      </label>
                      <select
                        value={form.creditAdvance}
                        onChange={e =>
                          setForm(prev => ({
                            ...prev,
                            creditAdvance: e.target.value as FormState['creditAdvance'],
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66]"
                      >
                        <option value="">-- Select --</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Financement de crédit
                      </label>
                      <select
                        value={form.creditFunding}
                        onChange={e =>
                          setForm(prev => ({
                            ...prev,
                            creditFunding: e.target.value as FormState['creditFunding'],
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66]"
                      >
                        <option value="">-- Select --</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Date</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Montant DJF</label>
                      <input
                        type="number"
                        min={0}
                        value={form.amountDjf}
                        onChange={e => setForm(prev => ({ ...prev, amountDjf: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Montant $</label>
                      <input
                        type="number"
                        min={0}
                        value={form.amountUsd}
                        onChange={e => setForm(prev => ({ ...prev, amountUsd: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-[#0F3C66]"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                      {formError}
                    </div>
                  )}

                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={goToStepTwo}
                      className="rounded-lg bg-[#0F3C66] px-5 py-2 text-sm font-medium text-white hover:bg-[#154b8a]"
                    >
                      Suivant
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-[#1E2F4A] px-4 py-3 text-sm font-medium text-yellow-300">
                    NOTE Les documents suivants sont facultatifs. Veuillez vous assurer qu&apos;ils sont
                    valides et en bon état.
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">
                      Document autre profit
                    </label>
                    <input
                      type="file"
                      onChange={e =>
                        setForm(prev => ({
                          ...prev,
                          documentFile: e.target.files?.[0] ?? null,
                          documentName: e.target.files?.[0]?.name || prev.documentName,
                        }))
                      }
                      className="block w-full rounded-md border border-gray-300 bg-[#34445F] text-sm text-white file:mr-4 file:border-0 file:bg-white file:px-4 file:py-2 file:text-gray-700"
                    />
                    {form.documentName && (
                      <p className="mt-1 text-xs text-gray-500">Fichier: {form.documentName}</p>
                    )}
                    <p className="mt-2 text-sm text-gray-500">Optional document upload.</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="rounded-lg bg-[#0F3C66] px-5 py-2 text-sm font-medium text-white hover:bg-[#154b8a]"
                    >
                      Précédent
                    </button>
                    <button
                      type="button"
                      onClick={handleCreate}
                      className="rounded-lg bg-[#0F3C66] px-5 py-2 text-sm font-medium text-white hover:bg-[#154b8a]"
                    >
                      {editingRowId !== null ? 'Mettre à jour' : 'Terminer'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {viewRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-3xl font-semibold text-[#0F3C66]">View Certificate Original</h2>
              <button
                type="button"
                onClick={closeViewModal}
                className="text-gray-500 transition hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {viewFields.map(field => (
                  <div key={field.label}>
                    <label className="mb-1 block text-sm font-medium text-gray-700">{field.label}</label>
                    <div className="rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-medium uppercase tracking-wide text-gray-600">
                      {field.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={closeViewModal}
                  className="rounded-lg bg-[#0F3C66] px-6 py-2 text-sm font-medium text-white hover:bg-[#154b8a]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


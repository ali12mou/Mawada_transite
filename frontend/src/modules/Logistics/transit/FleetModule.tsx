import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { listVehicles, listDrivers, upsertVehicle, upsertDriver } from '../../../api/transitDb';
import type { TransitVehicle, TransitDriver } from '../../../types/geosomTransit';

export function FleetModule() {
  const { t } = useLanguage();
  const [vehicles, setVehicles] = useState<TransitVehicle[]>([]);
  const [drivers, setDrivers] = useState<TransitDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'vehicles' | 'drivers'>('vehicles');
  const [vOpen, setVOpen] = useState(false);
  const [dOpen, setDOpen] = useState(false);
  const [vForm, setVForm] = useState<Partial<TransitVehicle>>({ status: 'available' });
  const [dForm, setDForm] = useState<Partial<TransitDriver>>({ status: 'active' });

  const load = async () => {
    try {
      const [v, d] = await Promise.all([listVehicles(), listDrivers()]);
      setVehicles(v);
      setDrivers(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveVehicle = async () => {
    if (!vForm.license_plate?.trim()) {
      alert(t('transit.fleet.errorLicense'));
      return;
    }
    try {
      await upsertVehicle({
        ...vForm,
        driver_id: vForm.driver_id || null,
      });
      setVOpen(false);
      setVForm({ status: 'available' });
      load();
    } catch (e: unknown) {
      alert((e as Error).message || t('common.errorSaving'));
    }
  };

  const saveDriver = async () => {
    if (!dForm.name?.trim()) {
      alert(t('transit.fleet.errorName'));
      return;
    }
    try {
      await upsertDriver(dForm);
      setDOpen(false);
      setDForm({ status: 'active' });
      load();
    } catch (e: unknown) {
      alert((e as Error).message || t('common.errorSaving'));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#0F3C66]">{t('transit.fleet.title')}</h1>
        <p className="text-sm text-gray-600">{t('transit.fleet.subtitle')}</p>
      </div>
      <div className="flex gap-2 border-b">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${tab === 'vehicles' ? 'border-b-2 border-[#EE964C] text-[#0F3C66]' : 'text-gray-500'}`}
          onClick={() => setTab('vehicles')}
        >
          {t('transit.fleet.tabVehicles')}
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium ${tab === 'drivers' ? 'border-b-2 border-[#EE964C] text-[#0F3C66]' : 'text-gray-500'}`}
          onClick={() => setTab('drivers')}
        >
          {t('transit.fleet.tabDrivers')}
        </button>
      </div>

      {tab === 'vehicles' && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setVForm({ status: 'available' });
                setVOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F3C66] px-4 py-2 text-sm text-white"
            >
              <Plus size={18} /> {t('transit.fleet.addVehicle')}
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">{t('transit.fleet.colLicensePlate')}</th>
                  <th className="px-3 py-2 text-left">{t('transit.fleet.colModel')}</th>
                  <th className="px-3 py-2 text-left">{t('transit.fleet.colOdometer')}</th>
                  <th className="px-3 py-2 text-left">{t('transit.fleet.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : vehicles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      {t('transit.fleet.emptyVehicles')}
                    </td>
                  </tr>
                ) : (
                  vehicles?.map(v => (
                    <tr key={v.id} className="border-b">
                      <td className="px-3 py-2 font-mono">{v.license_plate}</td>
                      <td className="px-3 py-2">{v.model || '—'}</td>
                      <td className="px-3 py-2">{v.odometer ?? '—'}</td>
                      <td className="px-3 py-2">{v.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'drivers' && (
        <>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setDForm({ status: 'active' });
                setDOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0F3C66] px-4 py-2 text-sm text-white"
            >
              <Plus size={18} /> {t('transit.fleet.addDriver')}
            </button>
          </div>
          <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left">{t('transit.fleet.colName')}</th>
                  <th className="px-3 py-2 text-left">{t('transit.fleet.colPhone')}</th>
                  <th className="px-3 py-2 text-left">{t('transit.fleet.colLicense')}</th>
                  <th className="px-3 py-2 text-left">{t('transit.fleet.colStatus')}</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : drivers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      {t('transit.fleet.emptyDrivers')}
                    </td>
                  </tr>
                ) : (
                  drivers?.map(d => (
                    <tr key={d.id} className="border-b">
                      <td className="px-3 py-2">{d.name}</td>
                      <td className="px-3 py-2">{d.phone || '—'}</td>
                      <td className="px-3 py-2">{d.license_number || '—'}</td>
                      <td className="px-3 py-2">{d.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {vOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{t('transit.fleet.modalTitleVehicle')}</h2>
            <div className="mt-4 space-y-3 text-sm">
              {['license_plate', 'model', 'fleet_manager', 'location', 'chassis_number'].map(f => (
                <label key={f} className="block capitalize">
                  {t(`transit.fleet.field${f.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')}`) || f.replace(/_/g, ' ')}
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={(vForm as Record<string, string>)[f] || ''}
                    onChange={e => setVForm({ ...vForm, [f]: e.target.value })}
                  />
                </label>
              ))}
              <label className="block">
                {t('transit.fleet.fieldOdometer')}
                <input
                  type="number"
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={vForm.odometer ?? ''}
                  onChange={e => setVForm({ ...vForm, odometer: parseFloat(e.target.value) || undefined })}
                />
              </label>
              <label className="block">
                {t('transit.fleet.fieldDriver')}
                <select
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={vForm.driver_id || ''}
                  onChange={e => setVForm({ ...vForm, driver_id: e.target.value || undefined })}
                >
                  <option value="">—</option>
                  {drivers?.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                {t('transit.fleet.fieldStatus')}
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={vForm.status || ''}
                  onChange={e => setVForm({ ...vForm, status: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded border px-4 py-2" onClick={() => setVOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="rounded bg-[#EE964C] px-4 py-2 text-white" onClick={saveVehicle}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {dOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold">{t('transit.fleet.modalTitleDriver')}</h2>
            <div className="mt-4 space-y-3 text-sm">
              <label className="block">
                {t('transit.fleet.fieldName')}
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={dForm.name || ''}
                  onChange={e => setDForm({ ...dForm, name: e.target.value })}
                />
              </label>
              <label className="block">
                {t('transit.fleet.fieldPhone')}
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={dForm.phone || ''}
                  onChange={e => setDForm({ ...dForm, phone: e.target.value })}
                />
              </label>
              <label className="block">
                {t('transit.fleet.fieldLicenseNumber')}
                <input
                  className="mt-1 w-full rounded border px-3 py-2"
                  value={dForm.license_number || ''}
                  onChange={e => setDForm({ ...dForm, license_number: e.target.value })}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" className="rounded border px-4 py-2" onClick={() => setDOpen(false)}>
                {t('common.cancel')}
              </button>
              <button type="button" className="rounded bg-[#EE964C] px-4 py-2 text-white" onClick={saveDriver}>
                {t('common.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



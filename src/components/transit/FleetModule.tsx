import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { listVehicles, listDrivers, upsertVehicle, upsertDriver } from '../../api/transitDb';
import type { TransitVehicle, TransitDriver } from '../../types/geosomTransit';

export function FleetModule() {
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
      alert('Immatriculation obligatoire');
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
      alert((e as Error).message || 'Erreur');
    }
  };

  const saveDriver = async () => {
    if (!dForm.name?.trim()) {
      alert('Nom obligatoire');
      return;
    }
    try {
      await upsertDriver(dForm);
      setDOpen(false);
      setDForm({ status: 'active' });
      load();
    } catch (e: unknown) {
      alert((e as Error).message || 'Erreur');
    }
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#1e3a5f]">Gestion de flotte</h1>
          <p className="text-sm text-gray-600">Véhicules et chauffeurs — liés aux transports et réservations.</p>
        </div>
        <div className="flex gap-2 border-b">
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${tab === 'vehicles' ? 'border-b-2 border-[#e67e22] text-[#1e3a5f]' : 'text-gray-500'}`}
            onClick={() => setTab('vehicles')}
          >
            Véhicules
          </button>
          <button
            type="button"
            className={`px-4 py-2 text-sm font-medium ${tab === 'drivers' ? 'border-b-2 border-[#e67e22] text-[#1e3a5f]' : 'text-gray-500'}`}
            onClick={() => setTab('drivers')}
          >
            Chauffeurs
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
                className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white"
              >
                <Plus size={18} /> Véhicule
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Immat.</th>
                    <th className="px-3 py-2 text-left">Modèle</th>
                    <th className="px-3 py-2 text-left">Odomètre</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center">
                        …
                      </td>
                    </tr>
                  ) : vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
                        Aucun véhicule.
                      </td>
                    </tr>
                  ) : (
                    vehicles.map(v => (
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
                className="inline-flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm text-white"
              >
                <Plus size={18} /> Chauffeur
              </button>
            </div>
            <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Nom</th>
                    <th className="px-3 py-2 text-left">Téléphone</th>
                    <th className="px-3 py-2 text-left">Permis</th>
                    <th className="px-3 py-2 text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center">
                        …
                      </td>
                    </tr>
                  ) : drivers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-gray-500">
                        Aucun chauffeur.
                      </td>
                    </tr>
                  ) : (
                    drivers.map(d => (
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
              <h2 className="text-lg font-semibold">Véhicule</h2>
              <div className="mt-4 space-y-3 text-sm">
                {['license_plate', 'model', 'fleet_manager', 'location', 'chassis_number'].map(f => (
                  <label key={f} className="block capitalize">
                    {f.replace(/_/g, ' ')}
                    <input
                      className="mt-1 w-full rounded border px-3 py-2"
                      value={(vForm as Record<string, string>)[f] || ''}
                      onChange={e => setVForm({ ...vForm, [f]: e.target.value })}
                    />
                  </label>
                ))}
                <label className="block">
                  Dernier odomètre
                  <input
                    type="number"
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={vForm.odometer ?? ''}
                    onChange={e => setVForm({ ...vForm, odometer: parseFloat(e.target.value) || undefined })}
                  />
                </label>
                <label className="block">
                  Chauffeur
                  <select
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={vForm.driver_id || ''}
                    onChange={e => setVForm({ ...vForm, driver_id: e.target.value || undefined })}
                  >
                    <option value="">—</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  Statut
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={vForm.status || ''}
                    onChange={e => setVForm({ ...vForm, status: e.target.value })}
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="rounded border px-4 py-2" onClick={() => setVOpen(false)}>
                  Fermer
                </button>
                <button type="button" className="rounded bg-[#e67e22] px-4 py-2 text-white" onClick={saveVehicle}>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}

        {dOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold">Chauffeur</h2>
              <div className="mt-4 space-y-3 text-sm">
                <label className="block">
                  Nom *
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={dForm.name || ''}
                    onChange={e => setDForm({ ...dForm, name: e.target.value })}
                  />
                </label>
                <label className="block">
                  Téléphone
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={dForm.phone || ''}
                    onChange={e => setDForm({ ...dForm, phone: e.target.value })}
                  />
                </label>
                <label className="block">
                  N° permis
                  <input
                    className="mt-1 w-full rounded border px-3 py-2"
                    value={dForm.license_number || ''}
                    onChange={e => setDForm({ ...dForm, license_number: e.target.value })}
                  />
                </label>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" className="rounded border px-4 py-2" onClick={() => setDOpen(false)}>
                  Fermer
                </button>
                <button type="button" className="rounded bg-[#e67e22] px-4 py-2 text-white" onClick={saveDriver}>
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}

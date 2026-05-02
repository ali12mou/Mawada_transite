import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit2, Trash2, MapPin, Navigation, Map as MapIcon } from 'lucide-react';
import Modal from './common/Modal';
import { ActionMenu } from './common/ActionMenu';

interface Route {
  id: string;
  source: string;
  destination: string;
  source_latitude?: number;
  source_longitude?: number;
  destination_latitude?: number;
  destination_longitude?: number;
  distance?: number;
  description?: string;
  created_at: string;
}

interface Location {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  created_at: string;
}

const DEFAULT_EAST_AFRICA_CITIES: { [key: string]: { lat: number; lng: number } } = {
  'Muqdisho': { lat: 2.0469, lng: 45.3182 },
  'Hargeysa': { lat: 9.56, lng: 44.065 },
  'Dire Dawa': { lat: 9.5931, lng: 41.8661 },
  'Addis Ababa': { lat: 9.0320, lng: 38.7469 },
  'Djibouti': { lat: 11.8251, lng: 42.5903 },
  'Bweyne': { lat: 4.6383, lng: 45.2009 },
  'Kismaayo': { lat: -0.3582, lng: 42.5454 },
  'Nairobi': { lat: -1.2864, lng: 36.8172 },
  'Mombasa': { lat: -4.0435, lng: 39.6682 }
};

export function Routes() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);

  const [formData, setFormData] = useState({
    source: '',
    destination: ''
  });

  const [locationFormData, setLocationFormData] = useState({
    name: '',
    latitude: '',
    longitude: ''
  });

  useEffect(() => {
    fetchRoutes();
    fetchLocations();
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from('routes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const allCities = {
    ...DEFAULT_EAST_AFRICA_CITIES,
    ...Object.fromEntries(locations?.map(loc => [loc.name, { lat: loc.latitude, lng: loc.longitude }]))
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const sourceCity = allCities[formData.source];
    const destCity = allCities[formData.destination];

    if (!sourceCity || !destCity) {
      alert('Invalid cities selected');
      return;
    }

    try {
      if (editingRoute) {
        const { error } = await supabase
          .from('routes')
          .update({
            source: formData.source,
            destination: formData.destination,
            source_latitude: sourceCity.lat,
            source_longitude: sourceCity.lng,
            destination_latitude: destCity.lat,
            destination_longitude: destCity.lng,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRoute.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('routes')
          .insert([{
            source: formData.source,
            destination: formData.destination,
            source_latitude: sourceCity.lat,
            source_longitude: sourceCity.lng,
            destination_latitude: destCity.lat,
            destination_longitude: destCity.lng,
            created_by: user?.id
          }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingRoute(null);
      resetForm();
      fetchRoutes();
    } catch (error) {
      console.error('Error saving route:', error);
    }
  };

  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase
        .from('locations')
        .insert([{
          name: locationFormData.name,
          latitude: parseFloat(locationFormData.latitude),
          longitude: parseFloat(locationFormData.longitude),
          created_by: user?.id
        }]);

      if (error) throw error;

      setShowLocationModal(false);
      resetLocationForm();
      fetchLocations();
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      source: route.source,
      destination: route.destination
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('routes.deleteConfirm'))) return;

    try {
      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchRoutes();
    } catch (error) {
      console.error('Error deleting route:', error);
    }
  };

  const resetForm = () => {
    setFormData({ source: '', destination: '' });
    setEditingRoute(null);
  };

  const resetLocationForm = () => {
    setLocationFormData({ name: '', latitude: '', longitude: '' });
  };

  const filteredRoutes = routes.filter(route =>
    route.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
    route.destination.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filteredRoutes.length / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const currentRoutes = filteredRoutes.slice(startIndex, startIndex + entriesPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-medium text-[#0F3C66]">
        {t('common.loading')}
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold text-gray-800 tracking-tight">{t('routes.title')}</h2>
          <Navigation size={24} className="text-gray-600" />
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium text-[#EE964C]">{t('common.version')}</div>
          <button
            onClick={() => setShowLocationModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition shadow-sm flex items-center gap-2"
          >
            <MapPin size={18} />
            {t('routes.addLocation')}
          </button>
          <button
            onClick={() => {
              setEditingRoute(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#0F3C66] text-white rounded hover:bg-[#154b8a] transition shadow-sm flex items-center gap-2"
          >
            <Plus size={18} />
            {t('routes.addRoute')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div className="bg-white rounded-lg shadow min-h-[500px]">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>Show</span>
              <select
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#0F3C66] outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>{t('common.entries')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{t('common.searchLabel')}</span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('routes.colSource')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('routes.colDestination')}</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">{t('common.action')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentRoutes?.map((route) => (
                  <tr key={route.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{route.source}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{route.destination}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <ActionMenu
                          actions={[
                            {
                              label: t('common.edit'),
                              icon: <Edit2 size={16} />,
                              onClick: () => handleEdit(route),
                            },
                            {
                              label: t('common.delete'),
                              icon: <Trash2 size={16} />,
                              onClick: () => handleDelete(route.id),
                              variant: 'danger',
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
                {currentRoutes.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-12 text-center text-gray-500 italic bg-gray-50/50">
                      <div className="flex flex-col items-center gap-2">
                        <MapIcon size={32} className="text-gray-300" />
                        {t('routes.empty')}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t flex justify-between items-center bg-gray-50 rounded-b-lg text-sm text-gray-600 font-medium">
            <div>
              {t('common.showing')} {startIndex + 1} {t('common.to')} {Math.min(startIndex + entriesPerPage, filteredRoutes.length)} {t('common.of')} {filteredRoutes.length} {t('common.entries')}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-300 rounded shadow-sm hover:bg-white disabled:opacity-40 transition"
              >
                {t('common.previous')}
              </button>
              <span className="font-bold">{currentPage} / {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-300 rounded shadow-sm hover:bg-white disabled:opacity-40 transition"
              >
                {t('common.next')}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-100 p-6 flex flex-col h-[525px]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MapIcon size={20} className="text-[#0F3C66]" />
              {t('routes.mapTitle')}
            </h3>
          </div>
          <div className="flex-1 rounded-lg bg-blue-50/30 border border-blue-50 relative overflow-hidden flex items-center justify-center p-4 shadow-inner">
            <svg viewBox="0 0 800 900" className="w-full h-full drop-shadow-xl overflow-scroll scrollbar-hide">
              <defs>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                </filter>
                <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#e0f2fe', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#bae6fd', stopOpacity: 1 }} />
                </linearGradient>
              </defs>

              <rect width="800" height="900" fill="url(#oceanGradient)" />

              <g id="countries">
                <path id="sudan" d="M 50,100 L 50,400 L 150,450 L 180,380 L 200,320 L 220,280 L 200,200 L 150,150 Z"
                  fill="#78ad6c" stroke="#5a8b4f" strokeWidth="2" />

                <path id="southsudan" d="M 50,400 L 50,550 L 120,580 L 160,560 L 180,520 L 150,450 Z"
                  fill="#8bb96f" stroke="#6b9b4f" strokeWidth="2" />

                <path id="ethiopia" d="M 200,200 L 220,280 L 200,320 L 180,380 L 150,450 L 180,520 L 220,540 L 280,560 L 340,520 L 380,450 L 400,380 L 420,320 L 440,280 L 460,240 L 440,200 L 400,180 L 350,170 L 300,180 L 250,190 Z"
                  fill="#9bc97f" stroke="#6b9b4f" strokeWidth="2" />

                <path id="eritrea" d="M 400,180 L 440,200 L 480,220 L 510,240 L 520,200 L 500,160 L 460,140 L 420,150 Z"
                  fill="#b8d99f" stroke="#8bb96f" strokeWidth="2" />

                <path id="djibouti" d="M 510,240 L 540,250 L 560,240 L 570,220 L 560,200 L 540,190 L 520,200 Z"
                  fill="#6b9b4f" stroke="#4d7b3f" strokeWidth="2" />

                <path id="somalia" d="M 460,240 L 480,280 L 500,340 L 520,420 L 540,500 L 560,580 L 580,660 L 600,740 L 580,780 L 540,800 L 480,780 L 440,740 L 420,680 L 400,620 L 380,560 L 360,500 L 340,440 L 340,380 L 360,320 L 400,280 L 440,260 Z"
                  fill="#6b9b4f" stroke="#4d7b3f" strokeWidth="2" />

                <path id="kenya" d="M 220,540 L 280,560 L 340,520 L 340,580 L 320,640 L 300,700 L 280,760 L 240,780 L 200,760 L 180,720 L 160,680 L 180,620 L 200,580 Z"
                  fill="#4d7b3f" stroke="#3d6b2f" strokeWidth="2" />

                <path id="uganda" d="M 120,580 L 160,560 L 180,520 L 220,540 L 200,580 L 180,620 L 160,660 L 140,640 L 120,620 Z"
                  fill="#8bb96f" stroke="#6b9b4f" strokeWidth="2" />

                <path id="rwanda" d="M 140,640 L 160,660 L 180,680 L 170,700 L 150,690 Z"
                  fill="#6b9b4f" stroke="#4d7b3f" strokeWidth="2" />

                <path id="burundi" d="M 150,690 L 170,700 L 180,720 L 170,740 L 150,730 Z"
                  fill="#5fb24c" stroke="#4a8b3f" strokeWidth="2" />
              </g>

              {/* ... routes mapping ... */}
              <g id="routes">
                {routes?.map((route, idx) => {
                  if (!route.source_latitude || !route.destination_latitude) return null;

                  const x1 = 400 + (route.source_longitude - 42) * 8;
                  const y1 = 450 - (route.source_latitude - 2) * 35;
                  const x2 = 400 + (route.destination_longitude - 42) * 8;
                  const y2 = 450 - (route.destination_latitude - 2) * 35;

                  return (
                    <g key={idx}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#dc2626"
                        strokeWidth="3"
                        strokeDasharray="8,4"
                        opacity="0.9"
                      />
                      <circle cx={x1} cy={y1} r="6" fill="#dc2626" stroke="#fff" strokeWidth="1.5" filter="url(#shadow)" />
                      <circle cx={x2} cy={y2} r="6" fill="#dc2626" stroke="#fff" strokeWidth="1.5" filter="url(#shadow)" />
                    </g>
                  );
                })}
              </g>

              {/* ... cities mapping ... */}
              <g id="cities">
                {Object.entries(allCities)?.map(([city, coords], idx) => {
                  const x = 400 + (coords.lng - 42) * 8;
                  const y = 450 - (coords.lat - 2) * 35;

                  const isCustom = locations.some(loc => loc.name === city);

                  return (
                    <g key={idx}>
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill={isCustom ? "#10b981" : "#0F3C66"}
                        stroke="#fff"
                        strokeWidth="1"
                        filter="url(#shadow)"
                      />
                      <text
                        x={x + 8}
                        y={y + 3}
                        fontSize="9"
                        fill="#000"
                        fontWeight="700"
                        style={{ textShadow: '1px 1px 3px white, -1px -1px 3px white' }}
                      >
                        {city}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          <div className="mt-4 flex items-center gap-4 text-xs font-bold flex-wrap opacity-80 uppercase tracking-wide">
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 border rounded-lg">
              <div className="w-3 h-3 bg-[#0F3C66] rounded-full border border-white"></div>
              <span>{t('routes.mapDefaultVilles')}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 border rounded-lg">
              <div className="w-3 h-3 bg-green-600 rounded-full border border-white"></div>
              <span>{t('routes.mapAddedLocalizations')}</span>
            </div>
            <div className="flex items-center gap-2 px-2 py-1 bg-gray-50 border rounded-lg">
              <div className="w-6 h-1 bg-red-600 rounded-sm"></div>
              <span>{t('routes.mapRoutes')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Route Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editingRoute ? t('routes.modalEditRoute') : t('routes.modalAddRoute')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('routes.colSource')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0F3C66] outline-none transition"
              required
            >
              <option value="">{t('common.select')}</option>
              {Object.keys(allCities).sort().map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('routes.colDestination')} <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.destination}
              onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#0F3C66] outline-none transition"
              required
            >
              <option value="">{t('common.select')}</option>
              {Object.keys(allCities).sort().map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t mt-6 font-bold text-sm">
            <button
              type="button"
              onClick={() => { setShowModal(false); resetForm(); }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#0F3C66] text-white rounded-md hover:bg-[#154b8a] transition shadow-sm"
            >
              {t('common.save')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Location Modal */}
      <Modal
        isOpen={showLocationModal}
        onClose={() => { setShowLocationModal(false); resetLocationForm(); }}
        title={t('routes.modalAddLocation')}
        size="md"
      >
        <form onSubmit={handleLocationSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              {t('routes.fieldCityName')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={locationFormData.name}
              onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none transition"
              placeholder="e.g. Berbera"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                {t('routes.fieldLatitude')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={locationFormData.latitude}
                onChange={(e) => setLocationFormData({ ...locationFormData, latitude: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none transition"
                placeholder="e.g. 10.43"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                {t('routes.fieldLongitude')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                value={locationFormData.longitude}
                onChange={(e) => setLocationFormData({ ...locationFormData, longitude: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-600 outline-none transition"
                placeholder="e.g. 45.03"
                required
              />
            </div>
          </div>

          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800 italic">
            <p className="font-bold mb-1 italic">TIP</p>
            <p>{t('routes.locationTip')}</p>
          </div>

          <div className="flex gap-3 pt-4 border-t mt-6 font-bold text-sm">
            <button
              type="button"
              onClick={() => { setShowLocationModal(false); resetLocationForm(); }}
              className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition shadow-sm"
            >
              {t('routes.addLocation')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}



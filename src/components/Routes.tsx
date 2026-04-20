import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, MapPin, Navigation } from 'lucide-react';

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
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
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

  useEffect(() => {
    filterRoutes();
  }, [routes, searchTerm]);

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

  const filterRoutes = () => {
    let filtered = [...routes];

    if (searchTerm) {
      filtered = filtered.filter(route =>
        route.source?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        route.destination?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRoutes(filtered);
  };

  const getAllCities = () => {
    const customLocations: { [key: string]: { lat: number; lng: number } } = {};
    locations.forEach(loc => {
      customLocations[loc.name] = { lat: loc.latitude, lng: loc.longitude };
    });
    return { ...DEFAULT_EAST_AFRICA_CITIES, ...customLocations };
  };

  const getCoordinates = (cityName: string) => {
    const allCities = getAllCities();
    return allCities[cityName] || { lat: 0, lng: 0 };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const sourceCoords = getCoordinates(formData.source);
      const destCoords = getCoordinates(formData.destination);

      const routeData = {
        source: formData.source,
        destination: formData.destination,
        source_latitude: sourceCoords.lat,
        source_longitude: sourceCoords.lng,
        destination_latitude: destCoords.lat,
        destination_longitude: destCoords.lng
      };

      if (editingRoute) {
        const { error } = await supabase
          .from('routes')
          .update({
            ...routeData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRoute.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('routes')
          .insert([{
            ...routeData,
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
          longitude: parseFloat(locationFormData.longitude)
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
      source: route.source || '',
      destination: route.destination || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet itinéraire ?')) return;

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
    setFormData({
      source: '',
      destination: ''
    });
  };

  const resetLocationForm = () => {
    setLocationFormData({
      name: '',
      latitude: '',
      longitude: ''
    });
  };

  const totalPages = Math.ceil(filteredRoutes.length / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = startIndex + entriesPerPage;
  const currentRoutes = filteredRoutes.slice(startIndex, endIndex);

  const allCities = getAllCities();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Navigation className="w-6 h-6 text-[#1e3a5f]" />
          <h1 className="text-2xl font-semibold text-gray-800">Itinéraires</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLocationModal(true)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
          >
            <MapPin size={16} />
            Ajouter Localisation
          </button>
          <button
            onClick={() => {
              setEditingRoute(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#2d4a6f] flex items-center gap-2"
          >
            <Plus size={16} />
            Ajouter Itinéraire
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Show</span>
                <select
                  value={entriesPerPage}
                  onChange={(e) => {
                    setEntriesPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#1e3a5f] focus:border-transparent"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-600">entries</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Search:</span>
                <input
                  type="text"
                  placeholder={t('common.search')}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">#</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Destination</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRoutes.map((route, index) => (
                  <tr key={route.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{startIndex + index + 1}</td>
                    <td className="px-4 py-3 text-sm text-[#1e3a5f] font-medium">{route.source}</td>
                    <td className="px-4 py-3 text-sm text-[#1e3a5f] font-medium">{route.destination}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(route)}
                          className="text-green-600 hover:bg-green-50 p-1.5 rounded transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(route.id)}
                          className="text-red-600 hover:bg-red-50 p-1.5 rounded transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {currentRoutes.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                      Aucun itinéraire trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredRoutes.length)} of {filteredRoutes.length} entries
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 bg-[#1e3a5f] text-white rounded">{currentPage}</span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Carte de l'Afrique de l'Est</h2>
            <div className="text-xs text-gray-500">{Object.keys(allCities).length} localisations</div>
          </div>

          <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg overflow-hidden border-2 border-gray-200">
            <svg viewBox="0 0 800 900" className="w-full h-full">
              <defs>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
                <linearGradient id="oceanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#bfdbfe', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#93c5fd', stopOpacity: 1 }} />
                </linearGradient>
              </defs>

              <rect width="800" height="900" fill="url(#oceanGradient)" />

              <g id="countries">
                <path id="sudan" d="M 50,100 L 50,400 L 150,450 L 180,380 L 200,320 L 220,280 L 200,200 L 150,150 Z"
                  fill="#2d5016" stroke="#1a3d0a" strokeWidth="2" />

                <path id="southsudan" d="M 50,400 L 50,550 L 120,580 L 160,560 L 180,520 L 150,450 Z"
                  fill="#3d6b26" stroke="#2d5016" strokeWidth="2" />

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
                  fill="#5a8b4f" stroke="#4a7b3f" strokeWidth="2" />
              </g>

              <g id="labels">
                <text x="100" y="250" fontSize="18" fontWeight="bold" fill="#1a3d0a">SUDAN</text>
                <text x="80" y="480" fontSize="14" fontWeight="bold" fill="#2d5016">SOUTH</text>
                <text x="80" y="498" fontSize="14" fontWeight="bold" fill="#2d5016">SUDAN</text>
                <text x="240" y="340" fontSize="20" fontWeight="bold" fill="#4d7b3f">ETHIOPIA</text>
                <text x="440" y="160" fontSize="14" fontWeight="bold" fill="#6b9b4f">ERITREA</text>
                <text x="480" y="230" fontSize="16" fontWeight="bold" fill="#2d5016">DJIBOUTI</text>
                <text x="450" y="500" fontSize="20" fontWeight="bold" fill="#3d6b2f">SOMALIA</text>
                <text x="240" y="680" fontSize="18" fontWeight="bold" fill="#2d5016">KENYA</text>
                <text x="120" y="600" fontSize="14" fontWeight="bold" fill="#4d7b3f">UGANDA</text>
                <text x="140" y="675" fontSize="12" fontWeight="bold" fill="#3d6b2f">RWANDA</text>
                <text x="130" y="720" fontSize="12" fontWeight="bold" fill="#3d6b2f">BURUNDI</text>
              </g>

              <text x="580" y="280" fontSize="12" fill="#1e3a5f" fontStyle="italic">Gulf of Aden</text>
              <text x="580" y="650" fontSize="11" fill="#1e3a5f" fontStyle="italic">Indian Ocean</text>

              <g id="routes">
                {routes.map((route, idx) => {
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
                      <circle cx={x1} cy={y1} r="8" fill="#dc2626" stroke="#fff" strokeWidth="2" filter="url(#shadow)" />
                      <circle cx={x2} cy={y2} r="8" fill="#dc2626" stroke="#fff" strokeWidth="2" filter="url(#shadow)" />
                    </g>
                  );
                })}
              </g>

              <g id="cities">
                {Object.entries(allCities).map(([city, coords], idx) => {
                  const x = 400 + (coords.lng - 42) * 8;
                  const y = 450 - (coords.lat - 2) * 35;

                  const isCustom = locations.some(loc => loc.name === city);

                  return (
                    <g key={idx}>
                      <circle
                        cx={x}
                        cy={y}
                        r="5"
                        fill={isCustom ? "#10b981" : "#1e3a5f"}
                        stroke="#fff"
                        strokeWidth="2"
                        filter="url(#shadow)"
                      />
                      <text
                        x={x + 10}
                        y={y + 4}
                        fontSize="10"
                        fill="#000"
                        fontWeight="700"
                        style={{ textShadow: '1px 1px 3px white, -1px -1px 3px white, 1px -1px 3px white, -1px 1px 3px white' }}
                      >
                        {city}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          <div className="mt-4 flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-[#1e3a5f] rounded-full border-2 border-white shadow"></div>
              <span className="text-gray-700">Villes par défaut</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-600 rounded-full border-2 border-white shadow"></div>
              <span className="text-gray-700">Localisations ajoutées</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-red-600 rounded"></div>
              <span className="text-gray-700">Itinéraires</span>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                {editingRoute ? 'Modifier l\'Itinéraire' : 'Ajouter un Itinéraire'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingRoute(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Source <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  required
                >
                  <option value="">Sélectionner une ville</option>
                  {Object.keys(allCities).sort().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
                  required
                >
                  <option value="">Sélectionner une ville</option>
                  {Object.keys(allCities).sort().map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-[#1e3a5f] text-white rounded-md hover:bg-[#2d4a6f]"
              >
                Enregistrer
              </button>
            </form>
          </div>
        </div>
      )}

      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Ajouter une Localisation</h2>
              <button
                onClick={() => {
                  setShowLocationModal(false);
                  resetLocationForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleLocationSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={locationFormData.name}
                  onChange={(e) => setLocationFormData({ ...locationFormData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: Berbera"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={locationFormData.latitude}
                  onChange={(e) => setLocationFormData({ ...locationFormData, latitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 10.4396"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="any"
                  value={locationFormData.longitude}
                  onChange={(e) => setLocationFormData({ ...locationFormData, longitude: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Ex: 45.0340"
                  required
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-800">
                <p className="font-medium mb-1">Astuce:</p>
                <p>Vous pouvez trouver les coordonnées sur Google Maps en faisant un clic droit sur un emplacement.</p>
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Ajouter la Localisation
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Download, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
}

interface Warehouse {
  id: string;
  name: string;
}

interface Inventory {
  id: string;
  product_id: string;
  warehouse_id: string;
  quantity: number;
  last_updated: string;
  products?: Product;
  warehouses?: Warehouse;
}

export function Inventories() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [inventories, setInventories] = useState<Inventory[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingInventory, setEditingInventory] = useState<Inventory | null>(null);

  const [formData, setFormData] = useState({
    product_id: '',
    warehouse_id: '',
    quantity: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [inventoriesRes, productsRes, warehousesRes] = await Promise.all([
        supabase
          .from('inventories')
          .select(`
            *,
            products (id, name),
            warehouses (id, name)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('products').select('id, name').order('name'),
        supabase.from('warehouses').select('id, name').order('name')
      ]);

      if (inventoriesRes.error) throw inventoriesRes.error;
      if (productsRes.error) throw productsRes.error;
      if (warehousesRes.error) throw warehousesRes.error;

      setInventories(inventoriesRes.data || []);
      setProducts(productsRes.data || []);
      setWarehouses(warehousesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingInventory) {
        const { error } = await supabase
          .from('inventories')
          .update({
            product_id: formData.product_id,
            warehouse_id: formData.warehouse_id,
            quantity: formData.quantity,
            last_updated: new Date().toISOString()
          })
          .eq('id', editingInventory.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('inventories')
          .insert([{
            product_id: formData.product_id,
            warehouse_id: formData.warehouse_id,
            quantity: formData.quantity,
            last_updated: new Date().toISOString(),
            created_by: user?.id
          }]);

        if (error) throw error;
      }

      setShowModal(false);
      setEditingInventory(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving inventory:', error);
      alert('Erreur lors de la sauvegarde. Veuillez vérifier que cette combinaison produit/entrepôt n\'existe pas déjà.');
    }
  };

  const handleEdit = (inventory: Inventory) => {
    setEditingInventory(inventory);
    setFormData({
      product_id: inventory.product_id || '',
      warehouse_id: inventory.warehouse_id || '',
      quantity: inventory.quantity || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet inventaire ?')) return;

    try {
      const { error } = await supabase
        .from('inventories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting inventory:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      product_id: '',
      warehouse_id: '',
      quantity: 0
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Inventaire</h1>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex justify-end gap-2">
          <button
            onClick={() => {
              setEditingInventory(null);
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ajouter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <Download className="w-4 h-4" />
            Exporter Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  ID d'inventaire <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Nom du produit <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Nom de l'entrepôt <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Quantité <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer">
                  Dernière mise à jour <span className="ml-1">▼</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {inventories.map((inventory, index) => (
                <tr key={inventory.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm">
                    {inventory.products?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-blue-600">
                    {inventory.warehouses?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm">{inventory.quantity}</td>
                  <td className="px-4 py-3 text-sm">
                    {inventory.last_updated
                      ? new Date(inventory.last_updated).toLocaleDateString('fr-FR')
                      : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(inventory)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(inventory.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {inventories.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    Aucun inventaire trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t">
          <div className="text-sm text-gray-600">
            <button className="text-blue-600 hover:underline">Afficher</button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-semibold">Ajouter un inventaire</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingInventory(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom du produit
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'entrepôt
                  </label>
                  <select
                    value={formData.warehouse_id}
                    onChange={(e) => setFormData({ ...formData, warehouse_id: e.target.value })}
                    className="w-full px-3 py-2 border border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Warehouse</option>
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantité
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    min="0"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

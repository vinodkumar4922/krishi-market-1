import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Plus,
  AlertCircle,
  CheckCircle2,
  Truck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { formatCurrency, formatUnit } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Product Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pUnit, setPUnit] = useState('kg');
  const [pQuantity, setPQuantity] = useState('');
  const [pMethod, setPMethod] = useState('ORGANIC');
  const [pDesc, setPDesc] = useState('');
  const [pImageUrl, setPImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchFarmerData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, productsRes, catRes] = await Promise.all([
        api.get('/farmer/dashboard-stats'),
        api.get('/orders/farmer'),
        api.get('/farmer/my-products'),
        api.get('/categories'),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (productsRes.data.success) setProducts(productsRes.data.data);
      if (catRes.data.success) {
        setCategories(catRes.data.data);
        if (catRes.data.data.length > 0 && !pCategory) {
          setPCategory(catRes.data.data[0]._id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [pCategory]);

  useEffect(() => {
    fetchFarmerData();
  }, [fetchFarmerData]);

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchFarmerData();
        showFeedback(`Order status updated to ${newStatus}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    setUploadingImage(true);
    setFormError('');

    try {
      const res = await api.post('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data.success) {
        setPImageUrl(res.data.url);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Image upload failed. Ensure JPG/PNG under 2MB.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setPName('');
    setPCategory(categories[0]?._id || '');
    setPPrice('');
    setPUnit('kg');
    setPQuantity('');
    setPMethod('ORGANIC');
    setPDesc('');
    setPImageUrl('');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    setPName(p.name);
    setPCategory(p.category?._id || p.category || '');
    setPPrice(p.price);
    setPUnit(p.unit || 'kg');
    setPQuantity(p.quantity);
    setPMethod(p.farmingMethod || 'ORGANIC');
    setPDesc(p.description || '');
    setPImageUrl(p.images?.[0] || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingProduct) {
        // Update product
        const res = await api.put(`/products/${editingProduct._id}`, {
          name: pName,
          category: pCategory,
          price: Number(pPrice),
          unit: pUnit,
          quantity: Number(pQuantity),
          farmingMethod: pMethod,
          description: pDesc,
          images: pImageUrl ? [pImageUrl] : editingProduct.images,
        });
        if (res.data.success) {
          setShowModal(false);
          fetchFarmerData();
          showFeedback('Product updated successfully!');
        }
      } else {
        // Create new product
        const res = await api.post('/products', {
          name: pName,
          category: pCategory || categories[0]?._id,
          price: Number(pPrice),
          unit: pUnit,
          quantity: Number(pQuantity),
          farmingMethod: pMethod,
          description: pDesc,
          images: pImageUrl ? [pImageUrl] : [],
          harvestDate: new Date(),
        });
        if (res.data.success) {
          setShowModal(false);
          fetchFarmerData();
          showFeedback('Harvest produce published live to marketplace!');
        }
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save product listing');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to deactivate this product listing?')) return;
    try {
      const res = await api.delete(`/products/${productId}`);
      if (res.data.success) {
        fetchFarmerData();
        showFeedback('Product listing deactivated.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleQuickRestock = async (productId, currentQty, addAmount) => {
    try {
      const newQty = currentQty + addAmount;
      const res = await api.put(`/products/${productId}`, { quantity: newQty });
      if (res.data.success) {
        fetchFarmerData();
        showFeedback(`Stock updated to ${newQty}`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restock');
    }
  };

  const showFeedback = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 2500);
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading producer telemetry & logistics..." />;
  }

  const farmer = stats?.farmer;
  const isApproved = farmer?.verificationStatus === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast */}
      {actionSuccess && (
        <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 z-50 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-krishi-400" />
          <span className="text-sm font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* Verification Status Banner */}
      {!isApproved && (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Farmer Verification Status: {farmer?.verificationStatus || 'PENDING'}
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Your farm details are under administrative review. Once verified, product additions will be published live to consumers.
              </p>
            </div>
          </div>
          <span className="px-3.5 py-1 bg-amber-200 text-amber-900 rounded-xl text-xs font-black uppercase tracking-wider">
            Review in Progress
          </span>
        </div>
      )}

      {/* Header with Add Product CTA */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {user?.name} 🌾
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Farm: {farmer?.farmName || 'Registered Farm'} • {farmer?.farmLocation?.district}, {farmer?.farmLocation?.state}
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          disabled={!isApproved}
          className="inline-flex items-center gap-2 px-5 py-3 bg-krishi-600 hover:bg-krishi-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-md transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> List New Harvest Product
        </button>
      </div>

      {/* KPI Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-400">Total Direct Realization</div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {formatCurrency(stats?.metrics?.totalSalesRevenue || 0)}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">100% Direct to Producer</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-400">Active Orders</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{stats?.metrics?.activeOrdersCount || 0}</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Require fulfillment</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-400">Listed Products</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats?.metrics?.totalProducts || 0}</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Active in catalog</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-400">Low Stock Alert</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{stats?.metrics?.lowStockCount || 0}</div>
          <div className="text-[11px] text-slate-400 font-semibold mt-1">Under 5 units</div>
        </div>
      </div>

      {/* ================================================== */}
      {/* MY HARVEST PRODUCTS & INVENTORY TABLE */}
      {/* ================================================== */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-krishi-600" /> My Harvest Products & Inventory
          </h2>
          <span className="text-xs font-semibold text-slate-400">{products.length} Products</span>
        </div>

        {products.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            You haven't listed any produce yet. Click "List New Harvest Product" above to publish your first crop.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-3 px-2">Produce</th>
                  <th className="py-3 px-2">Category</th>
                  <th className="py-3 px-2">Price</th>
                  <th className="py-3 px-2">Stock Level</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2">Quick Restock</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {products.map((p) => {
                  const isOutOfStock = p.quantity <= 0;
                  const isLowStock = p.quantity > 0 && p.quantity <= 5;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={p.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=150&q=80'}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-100"
                          />
                          <div>
                            <div className="font-extrabold text-slate-900">{p.name}</div>
                            <div className="text-[10px] text-slate-400">{p.farmingMethod}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2 font-semibold text-slate-600">{p.category?.name || 'Produce'}</td>
                      <td className="py-3 px-2 font-black text-slate-900">
                        {formatCurrency(p.price)} <span className="text-[10px] text-slate-400 font-normal">{formatUnit(p.unit)}</span>
                      </td>
                      <td className="py-3 px-2 font-extrabold text-slate-800">
                        {p.quantity} {p.unit}
                      </td>
                      <td className="py-3 px-2">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-red-100 text-red-700">
                            OUT OF STOCK
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-800">
                            LOW STOCK
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                            IN STOCK
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickRestock(p._id, p.quantity, 5)}
                            className="px-2 py-1 bg-slate-100 hover:bg-krishi-50 text-slate-700 hover:text-krishi-700 font-bold rounded text-[10px] transition"
                            title="Add 5 units"
                          >
                            +5
                          </button>
                          <button
                            onClick={() => handleQuickRestock(p._id, p.quantity, 10)}
                            className="px-2 py-1 bg-slate-100 hover:bg-krishi-50 text-slate-700 hover:text-krishi-700 font-bold rounded text-[10px] transition"
                            title="Add 10 units"
                          >
                            +10
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="Edit Product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p._id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Deactivate Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Incoming Orders Section */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-krishi-600" /> Incoming Customer Orders
        </h2>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-400 p-4 text-center">No customer orders placed yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 text-slate-400 font-bold uppercase">
                <tr>
                  <th className="py-2.5">Order #</th>
                  <th className="py-2.5">Customer</th>
                  <th className="py-2.5">Items</th>
                  <th className="py-2.5">Current Status</th>
                  <th className="py-2.5">Next Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {orders.map((o) => (
                  <tr key={o._id}>
                    <td className="py-3 font-mono font-bold text-slate-800">{o.orderNumber}</td>
                    <td className="py-3">
                      <div>{o.consumer?.name}</div>
                      <div className="text-[10px] text-slate-400">{o.deliveryAddress?.city}</div>
                    </td>
                    <td className="py-3">
                      {o.items.map((i) => `${i.name} (${i.quantity}${i.unit})`).join(', ')}
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-slate-100 text-slate-800">
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3">
                      {o.status === 'PLACED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o._id, 'CONFIRMED')}
                          className="px-2.5 py-1 bg-blue-600 text-white rounded-lg font-bold text-[11px]"
                        >
                          Confirm
                        </button>
                      )}
                      {o.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o._id, 'PREPARING')}
                          className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold text-[11px]"
                        >
                          Prepare Harvest
                        </button>
                      )}
                      {o.status === 'PREPARING' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o._id, 'READY_FOR_DELIVERY')}
                          className="px-2.5 py-1 bg-purple-600 text-white rounded-lg font-bold text-[11px]"
                        >
                          Ready for Delivery
                        </button>
                      )}
                      {o.status === 'READY_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o._id, 'OUT_FOR_DELIVERY')}
                          className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg font-bold text-[11px]"
                        >
                          Dispatch
                        </button>
                      )}
                      {o.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleUpdateOrderStatus(o._id, 'DELIVERED')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px]"
                        >
                          Mark Delivered
                        </button>
                      )}
                      {o.status === 'DELIVERED' && (
                        <span className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-black text-slate-900">
              {editingProduct ? 'Edit Harvest Produce' : 'List New Harvest Produce'}
            </h3>
            {formError && <p className="text-xs font-bold text-red-600 bg-red-50 p-2.5 rounded-xl">{formError}</p>}

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="e.g. Organic Pomegranate"
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Category</label>
                  <select
                    value={pCategory}
                    onChange={(e) => setPCategory(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl text-xs font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Method</label>
                  <select
                    value={pMethod}
                    onChange={(e) => setPMethod(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl text-xs font-semibold"
                  >
                    <option value="ORGANIC">Organic</option>
                    <option value="NATURAL">Natural</option>
                    <option value="CONVENTIONAL">Conventional</option>
                    <option value="HYDROPONIC">Hydroponic</option>
                    <option value="PERMACULTURE">Permaculture</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Unit</label>
                  <select
                    value={pUnit}
                    onChange={(e) => setPUnit(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl text-xs font-semibold"
                  >
                    <option value="kg">kg</option>
                    <option value="g">100g</option>
                    <option value="bunch">bunch</option>
                    <option value="dozen">dozen</option>
                    <option value="litre">litre</option>
                    <option value="packet">packet</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={pQuantity}
                    onChange={(e) => setPQuantity(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Secure Image Upload */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Produce Image</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleImageUpload}
                    className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-krishi-50 file:text-krishi-700 hover:file:bg-krishi-100"
                  />
                  {uploadingImage && <span className="text-[10px] text-slate-400 font-bold">Uploading...</span>}
                  {pImageUrl && (
                    <img src={pImageUrl} alt="Preview" className="w-10 h-10 rounded-lg object-cover border" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  placeholder="Grown fresh without synthetic pesticides..."
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-krishi-600 hover:bg-krishi-700 text-white rounded-xl text-xs font-bold shadow"
                >
                  {editingProduct ? 'Update Listing' : 'Publish Harvest'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;

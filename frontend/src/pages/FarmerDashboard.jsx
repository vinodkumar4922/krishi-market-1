import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Plus,
  AlertCircle,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Truck,
  Layers,
  ChevronRight,
} from 'lucide-react';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New product form modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState('');
  const [pPrice, setPPrice] = useState('');
  const [pUnit, setPUnit] = useState('kg');
  const [pQuantity, setPQuantity] = useState('');
  const [pMethod, setPMethod] = useState('ORGANIC');
  const [pDesc, setPDesc] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchFarmerData();
  }, []);

  const fetchFarmerData = async () => {
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
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      if (res.data.success) {
        fetchFarmerData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const res = await api.post('/products', {
        name: pName,
        category: pCategory || categories[0]?._id,
        price: Number(pPrice),
        unit: pUnit,
        quantity: Number(pQuantity),
        farmingMethod: pMethod,
        description: pDesc,
        harvestDate: new Date(),
      });
      if (res.data.success) {
        setShowAddModal(false);
        fetchFarmerData();
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create product listing');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500 font-bold">Loading farmer telemetry...</div>;
  }

  const farmer = stats?.farmer;
  const isApproved = farmer?.verificationStatus === 'APPROVED';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Verification Status Banner */}
      {!isApproved && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Farmer Verification Status: {farmer?.verificationStatus || 'PENDING'}
              </h3>
              <p className="text-xs text-amber-700">
                Your farm details are under administrative review. Once verified, product additions will be published live to consumers.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-amber-200 text-amber-800 rounded-lg text-xs font-bold uppercase tracking-wider">
            Review in Progress
          </span>
        </div>
      )}

      {/* Header with Add Product CTA */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Welcome back, {user?.name} 🌾
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Farm: {farmer?.farmLocation?.address}, {farmer?.farmLocation?.district}, {farmer?.farmLocation?.state}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          disabled={!isApproved}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-krishi-600 hover:bg-krishi-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow transition"
        >
          <Plus className="w-4 h-4" /> Add Harvest Product
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase text-slate-400">Total Direct Realization</div>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{stats?.metrics?.totalSalesRevenue || 0}</div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1">100% Realized to Farmer</div>
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

      {/* Incoming Orders Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-extrabold text-slate-900 mb-4 flex items-center gap-2">
          <Truck className="w-5 h-5 text-krishi-600" /> Incoming Customer Orders
        </h2>

        {orders.length === 0 ? (
          <p className="text-xs text-slate-400">No customer orders placed yet.</p>
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

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">List New Harvest Produce</h3>
            {formError && <p className="text-xs font-bold text-red-600">{formError}</p>}

            <form onSubmit={handleCreateProduct} className="space-y-3">
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
                    <option value="bunch">bunch</option>
                    <option value="dozen">dozen</option>
                    <option value="litre">litre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Quantity</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={pQuantity}
                    onChange={(e) => setPQuantity(e.target.value)}
                    className="w-full px-2 py-2 border rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description</label>
                <textarea
                  rows="2"
                  value={pDesc}
                  onChange={(e) => setPDesc(e.target.value)}
                  placeholder="Grown fresh without chemicals..."
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-krishi-600 text-white rounded-xl text-xs font-bold shadow"
                >
                  Publish Harvest
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

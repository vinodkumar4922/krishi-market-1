import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const Cart = () => {
  const { cartItems, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Delivery Form
  const [fullName, setFullName] = useState(user?.name || 'Anita Sharma');
  const [phone, setPhone] = useState(user?.phone || '+91 9880011223');
  const [street, setStreet] = useState('Flat 402, Sunshine Residency, Outer Ring Road');
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pincode, setPincode] = useState('560103');
  const [deliveryDate, setDeliveryDate] = useState(() =>
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [deliverySlot, setDeliverySlot] = useState('08:00–10:00');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(null);

  const [deliverySlots, setDeliverySlots] = useState([]);

  // Fetch dynamic slots with capacity
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const res = await api.get('/delivery-slots', { params: { date: deliveryDate } });
        if (res.data.success && res.data.data) {
          setDeliverySlots(res.data.data);
          const firstAvailable = res.data.data.find((s) => s.isAvailable);
          if (firstAvailable) {
            setDeliverySlot(firstAvailable.slotName);
          }
        }
      } catch (e) {
        console.error('Failed to load slots:', e);
      }
    };
    fetchSlots();
  }, [deliveryDate]);

  const deliveryFee = subtotal >= 500 ? 0 : 40;
  const total = subtotal + deliveryFee;

  // Group items by farmer (Multi-Farmer Cart visualization)
  const groupedByFarmer = cartItems.reduce((acc, item) => {
    const fId = item.product.farmer?._id || 'unknown';
    if (!acc[fId]) {
      acc[fId] = {
        farmerName: item.product.farmer?.user?.name || item.product.farmer?.farmName || 'Verified Producer',
        district: item.product.farmer?.farmLocation?.district || 'Regional Farm',
        items: [],
      };
    }
    acc[fId].items.push(item);
    return acc;
  }, {});

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.product._id,
          quantity: item.quantity,
        })),
        deliveryAddress: {
          fullName,
          phone,
          street,
          city,
          state,
          pincode,
        },
        deliveryDate,
        deliverySlot,
      };

      const res = await api.post('/orders', payload);
      if (res.data.success) {
        setOrderSuccess(res.data.data);
        clearCart();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Checkout failed. Please review stock availability.');
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-inner">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-2">Order Confirmed!</h2>
        <p className="text-slate-500 mb-6">
          Your order <span className="font-mono font-bold text-krishi-700">#{orderSuccess.orderNumber}</span> has
          been reserved with local farmers.
        </p>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-left mb-6 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Delivery Summary</div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-slate-500">Scheduled Date:</span>
            <span className="font-semibold text-slate-800">{orderSuccess.deliveryDate}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-slate-500">Delivery Slot:</span>
            <span className="font-semibold text-slate-800">{orderSuccess.deliverySlot}</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span className="text-slate-500">Total Authoritative Amount:</span>
            <span className="font-black text-emerald-600 text-base">₹{orderSuccess.total}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/orders/${orderSuccess._id}`}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-krishi-600 hover:bg-krishi-700 text-white font-bold rounded-xl shadow transition text-sm"
          >
            Track Order Status <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/orders"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-sm"
          >
            View All Orders
          </Link>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Your harvest cart is empty</h2>
        <p className="text-slate-500 mb-6 max-w-sm mx-auto">
          Discover fresh fruits, vegetables, grains, and dairy straight from regional growers.
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-3 bg-krishi-600 hover:bg-krishi-700 text-white font-bold rounded-xl shadow transition"
        >
          Go to Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Checkout & Multi-Farmer Cart</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-7 space-y-6">
          {Object.entries(groupedByFarmer).map(([farmerId, group]) => (
            <div key={farmerId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-krishi-50 text-krishi-700 rounded-lg flex items-center justify-center font-bold text-xs">
                    🌾
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{group.farmerName}</h3>
                    <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-krishi-600" /> {group.district}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-krishi-700 bg-krishi-50 px-2.5 py-1 rounded-full border border-krishi-200">
                  Direct Harvest
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {group.items.map(({ product, quantity }) => (
                  <div key={product._id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80'}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-100"
                      />
                      <div>
                        <h4 className="text-sm font-bold text-slate-800">{product.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold">
                          ₹{product.price} / {product.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                        <button
                          onClick={() => updateQuantity(product._id, quantity - 1)}
                          className="p-1.5 text-slate-500 hover:text-slate-800"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-900">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product._id, quantity + 1)}
                          disabled={quantity >= product.quantity}
                          className="p-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-30"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-sm font-black text-slate-900">₹{product.price * quantity}</span>
                      </div>

                      <button
                        onClick={() => removeFromCart(product._id)}
                        className="p-2 text-slate-400 hover:text-red-500 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Checkout Form & Order Summary */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleCheckout} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-krishi-600" /> Delivery Address & Slot
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Recipient Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Street Address
              </label>
              <input
                type="text"
                required
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  City
                </label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  State
                </label>
                <input
                  type="text"
                  required
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Pincode
                </label>
                <input
                  type="text"
                  required
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Delivery Date
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Delivery Slot
                </label>
                <select
                  value={deliverySlot}
                  onChange={(e) => setDeliverySlot(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
                >
                  {deliverySlots.length > 0 ? (
                    deliverySlots.map((slot) => (
                      <option
                        key={slot._id || slot.slotName}
                        value={slot.slotName}
                        disabled={!slot.isAvailable}
                      >
                        {slot.slotName} {!slot.isAvailable ? '(Fully Booked)' : `(${slot.remainingCapacity} left)`}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="08:00–10:00">08:00–10:00</option>
                      <option value="10:00–12:00">10:00–12:00</option>
                      <option value="12:00–14:00">12:00–14:00</option>
                      <option value="16:00–18:00">16:00–18:00</option>
                      <option value="18:00–20:00">18:00–20:00</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Bill summary */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Produce Subtotal:</span>
                <span className="font-bold">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600">
                <span>Local Delivery Fee:</span>
                <span>{deliveryFee === 0 ? <strong className="text-krishi-600">FREE</strong> : `₹${deliveryFee}`}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                <span>Authoritative Total:</span>
                <span className="text-krishi-700 text-lg">₹{total}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-krishi-600 hover:bg-krishi-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
            >
              {loading ? 'Confirming with Farmers...' : 'Place Farmer Direct Order'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Cart;

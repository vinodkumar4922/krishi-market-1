import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Package,
  Calendar,
  Clock,
  ChevronRight,
  ShoppingBag,
  CheckCircle,
  Truck,
  XCircle,
  FileText,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';

const ConsumerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/consumer');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch consumer orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your harvest orders..." />;
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 bg-krishi-50 text-krishi-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-krishi-200">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">No Orders Yet</h2>
        <p className="text-slate-500 mb-6 text-sm max-w-md mx-auto">
          You haven't placed any harvest orders yet. Browse our marketplace for fresh farm produce direct from growers!
        </p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-krishi-600 hover:bg-krishi-700 text-white font-bold rounded-xl shadow-md transition text-sm"
        >
          Explore Marketplace
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Farm Orders</h1>
          <p className="text-xs text-slate-400 mt-1">Track fulfillment and review farm produce</p>
        </div>
        <Link
          to="/marketplace"
          className="px-4 py-2 bg-krishi-50 text-krishi-700 hover:bg-krishi-100 font-bold rounded-xl text-xs transition border border-krishi-200"
        >
          Order Fresh Harvest
        </Link>
      </div>

      <div className="space-y-4">
        {orders.map((order) => {
          const isDelivered = order.status === 'DELIVERED';
          const isCancelled = order.status === 'CANCELLED';

          return (
            <div
              key={order._id}
              className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-base font-black text-slate-900">Order #{order.orderNumber}</span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(order.createdAt)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Slot: {order.deliverySlot}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 justify-between sm:justify-end">
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-600">{formatCurrency(order.total)}</div>
                    <div className="text-[10px] text-slate-400">Total ({order.items?.length || 0} items)</div>
                  </div>
                  <Link
                    to={`/orders/${order._id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-krishi-600 hover:bg-krishi-700 text-white font-bold rounded-xl text-xs shadow-sm transition"
                  >
                    Track Order <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Items summary */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                {order.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl text-xs"
                  >
                    <span className="font-bold text-slate-800">{item.name}</span>
                    <span className="text-slate-400">
                      ({item.quantity} {item.unit})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConsumerOrders;

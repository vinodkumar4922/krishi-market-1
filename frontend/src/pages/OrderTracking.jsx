import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Star,
  XCircle,
  ArrowLeft,
  Printer,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import LoadingSpinner from '../components/LoadingSpinner';

const ORDER_STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received & sent to farmers' },
  { key: 'CONFIRMED', label: 'Confirmed', desc: 'Farmer accepted order' },
  { key: 'PREPARING', label: 'Preparing', desc: 'Fresh harvest packed' },
  { key: 'READY_FOR_DELIVERY', label: 'Ready for Delivery', desc: 'Handed to courier' },
  { key: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', desc: 'En route to your address' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Successfully delivered' },
];

const OrderTracking = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Cancellation Modal
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Invoice Modal
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // Review Modal
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [productRating, setProductRating] = useState(5);
  const [farmerRating, setFarmerRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState(new Set());

  const fetchOrder = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      } else {
        setError(res.data.message || 'Failed to load order details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error fetching order tracking telemetry');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const getCurrentStepIndex = () => {
    if (!order) return 0;
    if (order.status === 'CANCELLED') return -1;
    const idx = ORDER_STEPS.findIndex((s) => s.key === order.status);
    return idx >= 0 ? idx : 0;
  };

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await api.patch(`/orders/${id}/cancel`, { reason: cancelReason });
      if (res.data.success) {
        setActionSuccess('Order cancelled successfully. Reserved inventory has been released.');
        setShowCancelModal(false);
        fetchOrder();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleOpenInvoice = async () => {
    setShowInvoiceModal(true);
    setLoadingInvoice(true);
    try {
      const res = await api.get(`/orders/${id}/invoice`);
      if (res.data.success) {
        setInvoiceData(res.data.data);
      }
    } catch (err) {
      console.error('Invoice load error:', err);
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleOpenReview = (item) => {
    setReviewProduct(item);
    setProductRating(5);
    setFarmerRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewProduct) return;
    setSubmittingReview(true);
    try {
      const payload = {
        orderId: order._id,
        productId: reviewProduct.product._id || reviewProduct.product,
        productRating,
        farmerRating,
        comment: reviewComment,
      };
      const res = await api.post('/reviews', payload);
      if (res.data.success) {
        setActionSuccess('Thank you! Your verified purchase review has been published.');
        setShowReviewModal(false);
        setReviewedProductIds((prev) => new Set([...prev, reviewProduct.product._id || reviewProduct.product]));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading order status and logistics telemetry..." />;
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-rose-200">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Order Not Available</h2>
        <p className="text-slate-500 mb-6 text-sm">{error || 'This order does not exist or you do not have permission.'}</p>
        <Link
          to="/marketplace"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-krishi-600 text-white rounded-xl font-bold text-sm"
        >
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const currentStep = getCurrentStepIndex();
  const isCancelled = order.status === 'CANCELLED';
  const canCancel = ['PLACED', 'CONFIRMED'].includes(order.status) && order.consumer?._id === user?._id;
  const isDelivered = order.status === 'DELIVERED';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between mb-6">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-krishi-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to My Orders
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenInvoice}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-bold text-xs rounded-xl shadow-sm transition"
          >
            <FileText className="w-4 h-4 text-krishi-600" /> View Tax Invoice
          </button>
          {canCancel && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition"
            >
              <XCircle className="w-4 h-4" /> Cancel Order
            </button>
          )}
        </div>
      </div>

      {actionSuccess && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Order #{order.orderNumber}
              </span>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
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
            <p className="text-xs text-slate-400">
              Placed on {formatDate(order.createdAt)} • Authoritative Concurrency-Guaranteed Reservation
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="text-xs font-medium text-slate-400">Grand Total</div>
            <div className="text-2xl font-black text-emerald-600">{formatCurrency(order.total)}</div>
          </div>
        </div>

        {/* 6-Step Visual Order Tracking Pipeline */}
        {isCancelled ? (
          <div className="mt-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
            <XCircle className="w-10 h-10 text-rose-600 mx-auto mb-2" />
            <h4 className="text-base font-black text-rose-900">This order has been CANCELLED</h4>
            <p className="text-xs text-rose-700 mt-1">
              All reserved farm inventory has been automatically restored to producers.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
              Visual Fulfillment Tracking
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {ORDER_STEPS.map((step, idx) => {
                const isPassed = currentStep >= idx;
                const isCurrent = currentStep === idx;
                return (
                  <div
                    key={step.key}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isCurrent
                        ? 'bg-krishi-50 border-krishi-500 shadow-sm ring-2 ring-krishi-200'
                        : isPassed
                        ? 'bg-emerald-50/60 border-emerald-200 text-slate-700'
                        : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {isPassed ? (
                        <CheckCircle className={`w-4 h-4 ${isCurrent ? 'text-krishi-600' : 'text-emerald-600'}`} />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                      )}
                      <span className={`text-[11px] font-black uppercase ${isCurrent ? 'text-krishi-800' : ''}`}>
                        Step {idx + 1}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 leading-tight">{step.label}</div>
                    <div className="text-[10px] text-slate-400 mt-1 leading-snug">{step.desc}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status History Timestamps */}
        {order.statusHistory && order.statusHistory.length > 0 && (
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Audit Timestamps</div>
            <div className="space-y-2">
              {order.statusHistory.map((h, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-krishi-600" />
                    <span className="font-bold text-slate-700">{h.status.replace(/_/g, ' ')}</span>
                    <span className="text-slate-400">— {h.comment}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(h.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grid: Produce Items (with Multi-Farmer Details) & Delivery Slot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-krishi-600" /> Harvest Items & Farmer Allocations
            </h3>
            <div className="divide-y divide-slate-100">
              {order.items.map((item, idx) => {
                const prodId = item.product?._id || item.product;
                const isReviewed = reviewedProductIds.has(prodId);
                return (
                  <div key={idx} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 bg-krishi-50 text-krishi-700 rounded-2xl flex items-center justify-center font-black text-sm border border-krishi-200">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900">{item.name}</h4>
                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                          <span>
                            {item.quantity} {item.unit} × {formatCurrency(item.price)}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-krishi-700 font-semibold">
                            Farmer: {item.farmer?.user?.name || item.farmer?.farmName || 'Verified Producer'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 justify-between sm:justify-end">
                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">{formatCurrency(item.itemTotal)}</div>
                        <div className="text-[10px] text-slate-400">Authoritative Subtotal</div>
                      </div>
                      {isDelivered && (
                        <button
                          onClick={() => handleOpenReview(item)}
                          disabled={isReviewed}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 ${
                            isReviewed
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-krishi-50 text-krishi-700 hover:bg-krishi-100 border border-krishi-200'
                          }`}
                        >
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {isReviewed ? 'Reviewed' : 'Review'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Delivery Details & Payment Breakdown */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-krishi-600" /> Delivery Details
            </h3>
            <div className="space-y-3.5 text-xs text-slate-600">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-krishi-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">{order.deliveryAddress?.fullName}</div>
                  <div>{order.deliveryAddress?.street}</div>
                  <div>
                    {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
                  </div>
                  <div className="text-slate-400 mt-0.5">Phone: {order.deliveryAddress?.phone}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-krishi-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">Scheduled Date</div>
                  <div>{order.deliveryDate}</div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-krishi-600 flex-shrink-0" />
                <div>
                  <div className="font-bold text-slate-800">Delivery Slot</div>
                  <div>{order.deliverySlot}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-4">Financial Summary</h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-800">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Logistics:</span>
                <span className="font-bold text-slate-800">
                  {order.deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : formatCurrency(order.deliveryFee)}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between text-sm font-black text-slate-900">
                <span>Grand Total:</span>
                <span className="text-emerald-600">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CANCELLATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <XCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-1">Cancel Order #{order.orderNumber}</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure? Once cancelled, reserved harvest inventory will be restored back to producers immediately.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for cancellation</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Ordered duplicate items, change of delivery schedule..."
                className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-none"
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition"
              >
                Keep Order
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={cancelling}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs transition"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAX INVOICE MODAL */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {loadingInvoice ? (
              <LoadingSpinner message="Generating official tax invoice..." />
            ) : invoiceData ? (
              <div>
                <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                  <div>
                    <span className="text-xl font-black text-slate-900">KRISHI MARKET</span>
                    <p className="text-[11px] text-slate-400">Direct Farmer-to-Consumer Agri Network</p>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-2">Invoice: {invoiceData.invoiceNumber}</p>
                    <p className="text-[11px] text-slate-400">Date: {formatDate(invoiceData.orderDate)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                      PAID / CONFIRMED
                    </span>
                    <button
                      onClick={() => window.print()}
                      className="block mt-4 text-xs font-bold text-krishi-600 hover:text-krishi-700 transition"
                    >
                      <Printer className="w-4 h-4 inline mr-1" /> Print Invoice
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
                  <div>
                    <div className="font-bold text-slate-400 uppercase text-[10px]">Billed To</div>
                    <div className="font-bold text-slate-800">{invoiceData.consumer?.name}</div>
                    <div className="text-slate-500">{invoiceData.consumer?.email}</div>
                    <div className="text-slate-500">{invoiceData.deliveryAddress?.street}</div>
                    <div className="text-slate-500">
                      {invoiceData.deliveryAddress?.city}, {invoiceData.deliveryAddress?.state} - {invoiceData.deliveryAddress?.pincode}
                    </div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-400 uppercase text-[10px]">Delivery Slot & Window</div>
                    <div className="font-bold text-slate-800">{invoiceData.deliveryDate}</div>
                    <div className="text-slate-500">{invoiceData.deliverySlot}</div>
                  </div>
                </div>

                <div className="py-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                        <th className="pb-2">Harvest Item</th>
                        <th className="pb-2">Farmer</th>
                        <th className="pb-2">Qty</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoiceData.items?.map((it, i) => (
                        <tr key={i} className="py-2">
                          <td className="py-2 font-bold text-slate-800">{it.productName}</td>
                          <td className="py-2 text-slate-500">{it.farmerName}</td>
                          <td className="py-2">
                            {it.quantity} {it.unit}
                          </td>
                          <td className="py-2">{formatCurrency(it.unitPrice)}</td>
                          <td className="py-2 text-right font-bold text-slate-800">{formatCurrency(it.itemTotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-4 border-t border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(invoiceData.financials?.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Delivery Fee:</span>
                    <span>{formatCurrency(invoiceData.financials?.deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-black text-sm text-slate-900 pt-2 border-t border-slate-100">
                    <span>Grand Total:</span>
                    <span className="text-emerald-600">{formatCurrency(invoiceData.financials?.total)}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowInvoiceModal(false)}
                    className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* REVIEW SUBMISSION MODAL */}
      {showReviewModal && reviewProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSubmitReview}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-6 h-6 text-amber-500 fill-amber-400" />
              <h3 className="text-lg font-black text-slate-900">Review Produce & Farmer</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Verified review for <span className="font-bold text-slate-800">{reviewProduct.name}</span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Produce Freshness & Quality (1–5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setProductRating(star)}
                      className="p-1 text-amber-500 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= productRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Farmer Reliability & Packaging (1–5 Stars)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFarmerRating(star)}
                      className="p-1 text-amber-500 focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 ${star <= farmerRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Customer Experience Feedback</label>
                <textarea
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details on crispness, taste, promptness..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                  rows={3}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingReview}
                className="px-5 py-2 bg-krishi-600 hover:bg-krishi-700 text-white rounded-xl font-bold text-xs transition"
              >
                {submittingReview ? 'Submitting...' : 'Post Verified Review'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;

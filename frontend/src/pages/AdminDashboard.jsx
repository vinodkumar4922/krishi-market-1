import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';
import {
  ShieldCheck,
  Users,
  Sprout,
  ShoppingBag,
  Package,
  BarChart3,
  FileSpreadsheet,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Search,
  Plus,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  X,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

const AdminDashboard = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState('overview');

  // Loading & Refresh
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core Data States
  const [analytics, setAnalytics] = useState(null);
  const [farmers, setFarmers] = useState([]);
  const [consumers, setConsumers] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [securityEvents, setSecurityEvents] = useState([]);

  // Detailed Analytics
  const [analyticsRange, setAnalyticsRange] = useState('30days');
  const [detailedAnalytics, setDetailedAnalytics] = useState(null);

  // Reports
  const [selectedReportType, setSelectedReportType] = useState('sales');
  const [reportData, setReportData] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  // Filters & Searches
  const [farmerSearch, setFarmerSearch] = useState('');
  const [farmerFilter, setFarmerFilter] = useState('ALL');
  const [consumerSearch, setConsumerSearch] = useState('');
  const [consumerFilter, setConsumerFilter] = useState('ALL');
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [disputeFilter, setDisputeFilter] = useState('ALL');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');

  // Modals & Action States
  const [inspectFarmer, setInspectFarmer] = useState(null);
  const [verifyModalFarmer, setVerifyModalFarmer] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState('APPROVED');
  const [verifyNotes, setVerifyNotes] = useState('');

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', icon: 'Leaf' });

  const [resolveModalDispute, setResolveModalDispute] = useState(null);
  const [disputeResolveStatus, setDisputeResolveStatus] = useState('RESOLVED');
  const [disputeResolveNotes, setDisputeResolveNotes] = useState('');

  // Initial Load
  useEffect(() => {
    fetchCoreData();
  }, []);

  // Fetch Detailed Analytics when tab or range changes
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchDetailedAnalytics();
    }
  }, [activeTab, analyticsRange]);

  // Fetch Report when tab or report type changes
  useEffect(() => {
    if (activeTab === 'reports') {
      fetchReport(selectedReportType);
    }
  }, [activeTab, selectedReportType]);

  const fetchCoreData = async () => {
    setLoading(true);
    try {
      const [
        analyticsRes,
        farmersRes,
        consumersRes,
        productsRes,
        categoriesRes,
        ordersRes,
        disputesRes,
        auditRes,
        securityRes,
      ] = await Promise.all([
        api.get('/admin/analytics'),
        api.get('/admin/all-farmers'),
        api.get('/admin/consumers'),
        api.get('/admin/products'),
        api.get('/categories?all=true'),
        api.get('/admin/orders'),
        api.get('/disputes/admin'),
        api.get('/admin/audit-logs'),
        api.get('/admin/security-events'),
      ]);

      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
      if (farmersRes.data.success) setFarmers(farmersRes.data.data);
      if (consumersRes.data.success) setConsumers(consumersRes.data.data);
      if (productsRes.data.success) setProducts(productsRes.data.data);
      if (categoriesRes.data.success) setCategories(categoriesRes.data.data);
      if (ordersRes.data.success) setOrders(ordersRes.data.data);
      if (disputesRes.data.success) setDisputes(disputesRes.data.data);
      if (auditRes.data.success) setAuditLogs(auditRes.data.data);
      if (securityRes.data.success) setSecurityEvents(securityRes.data.data);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDetailedAnalytics = async () => {
    try {
      const res = await api.get(`/admin/analytics/detailed?range=${analyticsRange}`);
      if (res.data.success) {
        setDetailedAnalytics(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load detailed analytics:', err);
    }
  };

  const fetchReport = async (type) => {
    setReportLoading(true);
    try {
      const res = await api.get(`/admin/reports/${type}`);
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setReportLoading(false);
    }
  };

  // Farmer Actions
  const handleFarmerVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verifyModalFarmer) return;
    try {
      const res = await api.patch(`/admin/verify-farmer/${verifyModalFarmer._id}`, {
        status: verifyStatus,
        notes: verifyNotes || (verifyStatus === 'APPROVED' ? 'Verified farm details' : 'Documents incomplete'),
      });
      if (res.data.success) {
        setVerifyModalFarmer(null);
        setVerifyNotes('');
        fetchCoreData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Verification update failed');
    }
  };

  // Consumer Actions
  const handleToggleConsumerStatus = async (consumerId) => {
    try {
      const res = await api.patch(`/admin/consumers/${consumerId}/toggle`);
      if (res.data.success) {
        fetchCoreData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update consumer status');
    }
  };

  // Product Actions
  const handleToggleProductStatus = async (productId) => {
    try {
      const res = await api.patch(`/admin/products/${productId}/toggle`);
      if (res.data.success) {
        fetchCoreData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle product status');
    }
  };

  // Category Actions
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, categoryForm);
      } else {
        await api.post('/categories', categoryForm);
      }
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', description: '', icon: 'Leaf' });
      fetchCoreData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleToggleCategoryStatus = async (categoryId) => {
    try {
      const res = await api.patch(`/categories/${categoryId}/toggle`);
      if (res.data.success) {
        fetchCoreData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle category');
    }
  };

  // Dispute Actions
  const handleResolveDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!resolveModalDispute) return;
    try {
      const res = await api.patch(`/disputes/${resolveModalDispute._id}/resolve`, {
        status: disputeResolveStatus,
        resolutionNotes: disputeResolveNotes || 'Resolved through administrative review.',
      });
      if (res.data.success) {
        setResolveModalDispute(null);
        setDisputeResolveNotes('');
        fetchCoreData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update dispute status');
    }
  };

  // CSV Export for Reports
  const exportReportCSV = () => {
    if (!reportData || !reportData.records || reportData.records.length === 0) return;
    const headers = Object.keys(reportData.records[0]).join(',');
    const rows = reportData.records.map((r) =>
      Object.values(r)
        .map((val) => `"${String(val).replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedReportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered Lists
  const filteredFarmers = useMemo(() => {
    return farmers.filter((f) => {
      const name = f.user?.name || f.farmName || '';
      const email = f.user?.email || '';
      const location = `${f.farmLocation?.district || ''} ${f.farmLocation?.state || ''}`;
      const matchesSearch =
        name.toLowerCase().includes(farmerSearch.toLowerCase()) ||
        email.toLowerCase().includes(farmerSearch.toLowerCase()) ||
        location.toLowerCase().includes(farmerSearch.toLowerCase());
      const matchesFilter = farmerFilter === 'ALL' || f.verificationStatus === farmerFilter;
      return matchesSearch && matchesFilter;
    });
  }, [farmers, farmerSearch, farmerFilter]);

  const filteredConsumers = useMemo(() => {
    return consumers.filter((c) => {
      const name = c.name || '';
      const email = c.email || '';
      const phone = c.phone || '';
      const matchesSearch =
        name.toLowerCase().includes(consumerSearch.toLowerCase()) ||
        email.toLowerCase().includes(consumerSearch.toLowerCase()) ||
        phone.toLowerCase().includes(consumerSearch.toLowerCase());
      const matchesFilter = consumerFilter === 'ALL' || c.accountStatus === consumerFilter;
      return matchesSearch && matchesFilter;
    });
  }, [consumers, consumerSearch, consumerFilter]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(productSearch.toLowerCase());
      const matchesCategory =
        productCategoryFilter === 'ALL' ||
        (p.category && (p.category._id === productCategoryFilter || p.category.name === productCategoryFilter));
      return matchesSearch && matchesCategory;
    });
  }, [products, productSearch, productCategoryFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        o.orderNumber?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        o.consumer?.name?.toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = orderStatusFilter === 'ALL' || o.status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const filteredDisputes = useMemo(() => {
    return disputes.filter((d) => {
      return disputeFilter === 'ALL' || d.status === disputeFilter;
    });
  }, [disputes, disputeFilter]);

  const filteredAuditLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      return auditActionFilter === 'ALL' || log.action === auditActionFilter;
    });
  }, [auditLogs, auditActionFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-krishi-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-700">Connecting to Krishi Governance Ledger...</p>
          <p className="text-xs text-slate-400">Loading verified database metrics & system audit logs</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Console Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-krishi-600 text-white flex items-center justify-center shadow-md shadow-krishi-200">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Admin Governance Center</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
                  LIVE SECURED
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Krishi Market Full Platform Authority • Real-time DB Aggregations • Audit Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setRefreshing(true);
                fetchCoreData();
              }}
              disabled={refreshing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh Platform State
            </button>
          </div>
        </div>

        {/* Global Tab Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-slate-200">
          {[
            { id: 'overview', label: 'Overview & KPIs', icon: BarChart3 },
            { id: 'farmers', label: `Farmers (${farmers.length})`, icon: Sprout },
            { id: 'consumers', label: `Consumers (${consumers.length})`, icon: Users },
            { id: 'products', label: `Products (${products.length})`, icon: Package },
            { id: 'categories', label: `Categories (${categories.length})`, icon: Layers },
            { id: 'orders', label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: 'disputes', label: `Disputes (${disputes.length})`, icon: AlertTriangle },
            { id: 'analytics', label: 'Analytics & Trends', icon: TrendingUp },
            { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
            { id: 'audit', label: 'Audit & Security', icon: Lock },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ============================================================================== */}
        {/* TAB 1: OVERVIEW & 13 OFFICIAL DATABASE-DRIVEN METRICS */}
        {/* ============================================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* The 13 Requested Database-Driven Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {/* 1. Total Farmers */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Farmers</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{analytics?.totalFarmers ?? 0}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">Platform registered producers</div>
              </div>

              {/* 2. Approved Farmers */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Approved Farmers</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{analytics?.approvedFarmers ?? 0}</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">Verified with publishing rights</div>
              </div>

              {/* 3. Pending Farmers */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Farmers</div>
                <div className="text-2xl font-black text-amber-500 mt-1">{analytics?.pendingFarmers ?? 0}</div>
                <div className="text-[11px] text-amber-700 font-semibold mt-1">Awaiting admin review</div>
              </div>

              {/* 4. Rejected Farmers */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rejected Farmers</div>
                <div className="text-2xl font-black text-rose-500 mt-1">{analytics?.rejectedFarmers ?? 0}</div>
                <div className="text-[11px] text-rose-700 font-medium mt-1">Incomplete or invalid doc</div>
              </div>

              {/* 5. Total Consumers */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Consumers</div>
                <div className="text-2xl font-black text-blue-600 mt-1">{analytics?.totalConsumers ?? 0}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">Direct retail buyers</div>
              </div>

              {/* 6. Active Products */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Products</div>
                <div className="text-2xl font-black text-krishi-600 mt-1">{analytics?.activeProducts ?? 0}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">Live in marketplace catalog</div>
              </div>

              {/* 7. Total Orders */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</div>
                <div className="text-2xl font-black text-slate-900 mt-1">{analytics?.totalOrders ?? 0}</div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">All recorded checkouts</div>
              </div>

              {/* 8. Delivered Orders */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Delivered Orders</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{analytics?.deliveredOrders ?? 0}</div>
                <div className="text-[11px] text-emerald-700 font-semibold mt-1">Successfully fulfilled</div>
              </div>

              {/* 9. Cancelled Orders */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cancelled Orders</div>
                <div className="text-2xl font-black text-rose-600 mt-1">{analytics?.cancelledOrders ?? 0}</div>
                <div className="text-[11px] text-rose-700 font-medium mt-1">Inventory restored</div>
              </div>

              {/* 10. Total Sales */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Sales</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ₹{Number(analytics?.totalSales || analytics?.platformSales || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">Direct farmer revenue realization</div>
              </div>

              {/* 11. Fulfilment Rate */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Fulfilment Rate</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">{analytics?.fulfillmentRate ?? 100}%</div>
                <div className="text-[11px] text-emerald-700 font-medium mt-1">Delivered / Total orders</div>
              </div>

              {/* 12. Repeat Customer Rate */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Repeat Customer Rate</div>
                <div className="text-2xl font-black text-indigo-600 mt-1">
                  {analytics?.repeatCustomerRate ?? 0}%
                </div>
                <div className="text-[11px] text-slate-500 font-medium mt-1">&gt;1 Completed Purchases</div>
              </div>

              {/* 13. Commission / Platform Facilitation */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Platform Commission</div>
                <div className="text-2xl font-black text-purple-600 mt-1">
                  ₹{Number(analytics?.commission ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-purple-700 font-medium mt-1">Transparent 2% facilitation fee</div>
              </div>
            </div>

            {/* Quick Action Queues & Alert Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Pending Approvals Quick Alert */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Sprout className="w-5 h-5 text-amber-500" /> Farmers Awaiting Verification
                  </h3>
                  <button
                    onClick={() => {
                      setFarmerFilter('PENDING');
                      setActiveTab('farmers');
                    }}
                    className="text-xs font-bold text-krishi-600 hover:text-krishi-700"
                  >
                    View All →
                  </button>
                </div>

                {farmers.filter((f) => f.verificationStatus === 'PENDING').length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    No pending farmers in queue. All applications reviewed!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {farmers
                      .filter((f) => f.verificationStatus === 'PENDING')
                      .slice(0, 3)
                      .map((f) => (
                        <div key={f._id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-slate-900">{f.user?.name || f.farmName}</div>
                            <div className="text-xs text-slate-500">
                              {f.farmLocation?.district}, {f.farmLocation?.state} • {f.farmingMethod}
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              setVerifyModalFarmer(f);
                              setVerifyStatus('APPROVED');
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                          >
                            Review
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Active Disputes Quick Alert */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-rose-500" /> Active Consumer Disputes
                  </h3>
                  <button
                    onClick={() => {
                      setDisputeFilter('OPEN');
                      setActiveTab('disputes');
                    }}
                    className="text-xs font-bold text-krishi-600 hover:text-krishi-700"
                  >
                    View All →
                  </button>
                </div>

                {disputes.filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW').length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                    Zero unresolved disputes. High customer satisfaction!
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {disputes
                      .filter((d) => d.status === 'OPEN' || d.status === 'UNDER_REVIEW')
                      .slice(0, 3)
                      .map((d) => (
                        <div key={d._id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-800">{d.reason}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                                {d.status}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-xs">{d.description}</div>
                          </div>
                          <button
                            onClick={() => {
                              setResolveModalDispute(d);
                              setDisputeResolveStatus('RESOLVED');
                            }}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold"
                          >
                            Resolve
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 2: FARMER MANAGEMENT */}
        {/* ============================================================================== */}
        {activeTab === 'farmers' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Farmer Verification & Profile Management</h2>
                <p className="text-xs text-slate-500">
                  Search, inspect farm credentials, and authorize/reject harvest sales permissions.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search farmer or district..."
                    value={farmerSearch}
                    onChange={(e) => setFarmerSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-krishi-500"
                  />
                </div>

                <select
                  value={farmerFilter}
                  onChange={(e) => setFarmerFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>

            {/* Farmers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Farmer & Farm Name</th>
                    <th className="pb-3">Location & Size</th>
                    <th className="pb-3">Method & Crops</th>
                    <th className="pb-3">Verification Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredFarmers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No farmers found matching filters.
                      </td>
                    </tr>
                  ) : (
                    filteredFarmers.map((f) => (
                      <tr key={f._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3">
                          <div className="font-bold text-slate-900">{f.user?.name || f.farmName}</div>
                          <div className="text-[11px] text-slate-500">{f.user?.email || f.farmName}</div>
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-slate-700">
                            {f.farmLocation?.district}, {f.farmLocation?.state}
                          </div>
                          <div className="text-[11px] text-slate-400">{f.farmSizeAcres} Acres</div>
                        </td>
                        <td className="py-3">
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[10px] font-bold">
                            {f.farmingMethod}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                            {f.cropTypes?.join(', ') || 'Various Produce'}
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              f.verificationStatus === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : f.verificationStatus === 'PENDING'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {f.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right space-x-2">
                          <button
                            onClick={() => setInspectFarmer(f)}
                            className="px-2.5 py-1 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg text-xs font-bold"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => {
                              setVerifyModalFarmer(f);
                              setVerifyStatus('APPROVED');
                            }}
                            className="px-2.5 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-xs font-bold"
                          >
                            Status
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 3: CONSUMER MANAGEMENT */}
        {/* ============================================================================== */}
        {activeTab === 'consumers' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Consumer Account Management</h2>
                <p className="text-xs text-slate-500">
                  Search, review order frequency, and toggle active/suspended account statuses. Passwords securely withheld.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={consumerSearch}
                    onChange={(e) => setConsumerSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-krishi-500"
                  />
                </div>

                <select
                  value={consumerFilter}
                  onChange={(e) => setConsumerFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="ALL">All Accounts</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>

            {/* Consumers Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Consumer Name</th>
                    <th className="pb-3">Contact Email & Phone</th>
                    <th className="pb-3">Orders Placed</th>
                    <th className="pb-3">Account Status</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredConsumers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No consumers found.
                      </td>
                    </tr>
                  ) : (
                    filteredConsumers.map((c) => (
                      <tr key={c._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 font-bold text-slate-900">{c.name}</td>
                        <td className="py-3 text-slate-600">
                          <div>{c.email}</div>
                          <div className="text-[11px] text-slate-400">{c.phone || 'Phone not registered'}</div>
                        </td>
                        <td className="py-3 font-semibold text-slate-800">{c.totalOrders || 0} checkouts</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.accountStatus === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {c.accountStatus}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleToggleConsumerStatus(c._id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                              c.accountStatus === 'ACTIVE'
                                ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {c.accountStatus === 'ACTIVE' ? 'Suspend Account' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 4: PRODUCT MODERATION */}
        {/* ============================================================================== */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Product Moderation & Ownership Inspection</h2>
                <p className="text-xs text-slate-500">
                  Audit farmer produce, verify transparent pricing, and activate/deactivate listings.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search product name..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-krishi-500"
                  />
                </div>

                <select
                  value={productCategoryFilter}
                  onChange={(e) => setProductCategoryFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Products Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Produce Item</th>
                    <th className="pb-3">Farmer Ownership</th>
                    <th className="pb-3">Price & Stock</th>
                    <th className="pb-3">Market Status</th>
                    <th className="pb-3 text-right">Moderation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No products match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500">
                            {p.category?.name || 'Produce'} • {p.isOrganic ? '🌱 Organic' : 'Conventional'}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-slate-800">
                            {p.farmer?.user?.name || p.farmer?.farmName || 'Verified Farmer'}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {p.farmer?.farmLocation?.district}, {p.farmer?.farmLocation?.state}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="font-bold text-slate-900">
                            ₹{p.price}/{p.unit}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.quantity} {p.unit} ({p.availabilityStatus})
                          </div>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {p.isActive ? 'Active Listing' : 'Deactivated'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleToggleProductStatus(p._id)}
                            className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                              p.isActive
                                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {p.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 5: CATEGORY MANAGEMENT */}
        {/* ============================================================================== */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Agri Produce Categories</h2>
                <p className="text-xs text-slate-500">
                  Organize marketplace taxonomy. Deactivating categories preserves existing product links safely.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingCategory(null);
                  setCategoryForm({ name: '', description: '', icon: 'Leaf' });
                  setCategoryModalOpen(true);
                }}
                className="px-4 py-2 bg-krishi-600 hover:bg-krishi-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>

            {/* Category Cards / Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat._id}
                  className={`p-5 rounded-2xl border transition-all ${
                    cat.isActive ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🌿</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                        cat.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {cat.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mt-2">{cat.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{cat.description || 'Farm produce category'}</p>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => {
                        setEditingCategory(cat);
                        setCategoryForm({
                          name: cat.name,
                          description: cat.description || '',
                          icon: cat.icon || 'Leaf',
                        });
                        setCategoryModalOpen(true);
                      }}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900"
                    >
                      Edit Details
                    </button>
                    <button
                      onClick={() => handleToggleCategoryStatus(cat._id)}
                      className={`text-xs font-bold ${
                        cat.isActive ? 'text-amber-600 hover:text-amber-700' : 'text-emerald-600 hover:text-emerald-700'
                      }`}
                    >
                      {cat.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 6: ORDER MONITORING */}
        {/* ============================================================================== */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Platform Order Monitoring</h2>
                <p className="text-xs text-slate-500">
                  Track full order pipeline without unauthorized business rule overrides.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Order # or buyer..."
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    className="pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs w-48 sm:w-60 focus:outline-none focus:ring-2 focus:ring-krishi-500"
                  />
                </div>

                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PLACED">PLACED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="READY_FOR_DELIVERY">READY FOR DELIVERY</option>
                  <option value="OUT_FOR_DELIVERY">OUT FOR DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3">Order Number & Date</th>
                    <th className="pb-3">Consumer</th>
                    <th className="pb-3">Farmers Involved</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Financials</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => (
                      <tr key={o._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3">
                          <div className="font-bold text-slate-900">{o.orderNumber}</div>
                          <div className="text-[11px] text-slate-400">{new Date(o.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="py-3">
                          <div className="font-semibold text-slate-800">{o.consumer?.name || 'Customer'}</div>
                          <div className="text-[11px] text-slate-500">{o.consumer?.email}</div>
                        </td>
                        <td className="py-3">
                          <span className="font-medium text-slate-700">
                            {o.farmersInvolved?.length || 1} Farmer{(o.farmersInvolved?.length || 1) > 1 ? 's' : ''}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                              o.status === 'DELIVERED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : o.status === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-800'
                                : o.status === 'OUT_FOR_DELIVERY'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {o.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="font-black text-slate-900">₹{o.total}</div>
                          <div className="text-[11px] text-slate-400">Subtotal: ₹{o.subtotal}</div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 7: DISPUTES RESOLUTION */}
        {/* ============================================================================== */}
        {activeTab === 'disputes' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Consumer Dispute Resolution Center</h2>
                <p className="text-xs text-slate-500">
                  Manage quality, quantity, and delivery claims. Transition disputes from OPEN → UNDER_REVIEW → RESOLVED.
                </p>
              </div>

              <select
                value={disputeFilter}
                onChange={(e) => setDisputeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
              >
                <option value="ALL">All Dispute States</option>
                <option value="OPEN">OPEN</option>
                <option value="UNDER_REVIEW">UNDER REVIEW</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>

            {/* Disputes List */}
            <div className="divide-y divide-slate-100">
              {filteredDisputes.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">No disputes found for current filter.</div>
              ) : (
                filteredDisputes.map((d) => (
                  <div key={d._id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">{d.reason.replace(/_/g, ' ')}</span>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                            d.status === 'RESOLVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : d.status === 'UNDER_REVIEW'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {d.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{d.description}</p>
                      <div className="text-[11px] text-slate-400">
                        Raised by: <span className="font-bold text-slate-700">{d.user?.name || 'Consumer'}</span> • Order:{' '}
                        <span className="font-mono text-slate-700">{d.order?.orderNumber || d.order}</span>
                      </div>
                      {d.resolutionNotes && (
                        <div className="text-xs bg-slate-50 p-2 rounded-lg text-slate-700 border border-slate-100 mt-1">
                          <span className="font-bold text-slate-900">Admin Resolution:</span> {d.resolutionNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setResolveModalDispute(d);
                          setDisputeResolveStatus(d.status === 'OPEN' ? 'UNDER_REVIEW' : 'RESOLVED');
                        }}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
                      >
                        Update State
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 8: VISUAL ANALYTICS & TRENDS (REAL DB AGGREGATIONS) */}
        {/* ============================================================================== */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Time Range Bar */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-krishi-600" />
                <span className="text-xs font-bold text-slate-800">Aggregation Window:</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'today', label: 'Today' },
                  { id: '7days', label: 'Last 7 Days' },
                  { id: '30days', label: 'Last 30 Days' },
                  { id: 'this_month', label: 'This Month' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setAnalyticsRange(r.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      analyticsRange === r.id
                        ? 'bg-krishi-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Growth & Volume Indicators */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-400 uppercase">New Consumers Joined</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  +{detailedAnalytics?.newConsumers ?? consumers.length}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-400 uppercase">New Farmers Onboarded</div>
                <div className="text-2xl font-black text-emerald-600 mt-1">
                  +{detailedAnalytics?.newFarmers ?? farmers.length}
                </div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Fulfillment Success</div>
                <div className="text-2xl font-black text-blue-600 mt-1">{analytics?.fulfillmentRate ?? 100}%</div>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-slate-200">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Repeat Customer Gain</div>
                <div className="text-2xl font-black text-purple-600 mt-1">
                  {analytics?.repeatCustomerRate ?? 0}%
                </div>
              </div>
            </div>

            {/* Visual Charts: Orders over time & Order Statuses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Orders & Sales Activity Bar Chart */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-krishi-600" /> Real Orders & Sales Volume Timeline
                </h3>

                {detailedAnalytics?.ordersOverTime?.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No orders recorded during this timeframe.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {detailedAnalytics?.ordersOverTime?.map((item) => (
                      <div key={item._id} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                          <span>{item._id}</span>
                          <span>
                            {item.orderCount} Orders • ₹{item.salesVolume}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-krishi-600 h-3 rounded-full transition-all duration-500"
                            style={{
                              width: `${Math.min(100, Math.max(15, item.orderCount * 25))}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Status Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" /> Pipeline Status Distribution
                </h3>

                <div className="space-y-3">
                  {detailedAnalytics?.orderStatuses?.map((item) => (
                    <div key={item._id} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-700">
                        <span>{item._id.replace(/_/g, ' ')}</span>
                        <span className="font-bold text-slate-900">{item.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, Math.max(10, (item.count / (orders.length || 1)) * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Products & Top Farmers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Products */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> Top Demand Produce Catalog
                </h3>
                <div className="divide-y divide-slate-100">
                  {detailedAnalytics?.topProducts?.map((p, idx) => (
                    <div key={p._id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-xs text-slate-800">{p._id}</span>
                      </div>
                      <div className="text-xs text-right">
                        <span className="font-bold text-slate-900">{p.totalQuantity} Units</span>
                        <span className="text-[11px] text-slate-400 block">₹{p.totalRevenue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Rated Farmers */}
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-krishi-600" /> Top Rated Direct Producers
                </h3>
                <div className="divide-y divide-slate-100">
                  {detailedAnalytics?.topFarmers?.map((f) => (
                    <div key={f._id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-xs text-slate-800">{f.user?.name || f.farmName}</div>
                        <div className="text-[11px] text-slate-400">
                          {f.farmLocation?.district}, {f.farmLocation?.state} • {f.farmingMethod}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-amber-500">★ {f.rating?.average?.toFixed(1) || '5.0'}</span>
                        <span className="text-[11px] text-slate-400 block">{f.rating?.count || 1} Reviews</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 9: REPORTS GENERATOR */}
        {/* ============================================================================== */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Official Platform Audit Reports</h2>
                <p className="text-xs text-slate-500">
                  Generate verified database reports for compliance, taxation, and farmer payouts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={exportReportCSV}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {/* Report Selector Pills */}
            <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4">
              {[
                { id: 'sales', label: 'Sales Report' },
                { id: 'orders', label: 'Order Report' },
                { id: 'farmers', label: 'Farmer Report' },
                { id: 'consumers', label: 'Consumer Report' },
                { id: 'products', label: 'Product Report' },
                { id: 'categories', label: 'Category Report' },
                { id: 'fulfilment', label: 'Fulfilment Report' },
                { id: 'commission', label: 'Commission Report' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedReportType(r.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedReportType === r.id
                      ? 'bg-krishi-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Report Summary Cards if available */}
            {reportData?.summary && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {Object.entries(reportData.summary).map(([key, val]) => (
                  <div key={key}>
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </div>
                    <div className="text-lg font-black text-slate-900 mt-0.5">
                      {typeof val === 'number' && key.toLowerCase().includes('total') && !key.toLowerCase().includes('order')
                        ? `₹${val.toLocaleString()}`
                        : val}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Report Table */}
            {reportLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">Generating report from database records...</div>
            ) : reportData?.records?.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">Zero records found for this report type.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      {Object.keys(reportData?.records?.[0] || {}).map((col) => (
                        <th key={col} className="pb-3 pr-4">
                          {col.replace(/([A-Z])/g, ' $1')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData?.records?.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        {Object.values(row).map((val, cIdx) => (
                          <td key={cIdx} className="py-3 pr-4 font-medium text-slate-700">
                            {typeof val === 'boolean'
                              ? val
                                ? 'Yes'
                                : 'No'
                              : typeof val === 'object' && val !== null
                              ? JSON.stringify(val)
                              : String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ============================================================================== */}
        {/* TAB 10: AUDIT LOGS & SECURITY VIEW */}
        {/* ============================================================================== */}
        {activeTab === 'audit' && (
          <div className="space-y-6">
            {/* Top Security Status Card */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-base font-bold">Platform Security Center & Threat Monitoring</h2>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase">
                  ACTIVE DEFENSE ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-2xl">
                Real-time security telemetry: failed login interception, rate-limit triggers, unauthorized access
                attempts, and file upload validation. Sensitive passwords, tokens, and authorization headers are never logged.
              </p>
            </div>

            {/* Security Events View */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" /> Security Telemetry & Access Incidents
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Event Type</th>
                      <th className="pb-3">Actor / IP Address</th>
                      <th className="pb-3">Details</th>
                      <th className="pb-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {securityEvents.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400">
                          Zero suspicious incidents recorded.
                        </td>
                      </tr>
                    ) : (
                      securityEvents.map((ev) => (
                        <tr key={ev._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                ev.action.includes('FAILURE') || ev.action.includes('UNAUTHORIZED')
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {ev.action}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="font-bold text-slate-800">{ev.actor?.name || 'Anonymous IP'}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{ev.ipAddress || '127.0.0.1'}</div>
                          </td>
                          <td className="py-3 text-slate-600 max-w-xs truncate">
                            {JSON.stringify(ev.details || {})}
                          </td>
                          <td className="py-3 text-right text-slate-400 text-[11px]">
                            {new Date(ev.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* General Audit Logs */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-krishi-600" /> Administrative Governance Audit Trail
                </h3>

                <select
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                >
                  <option value="ALL">All Audit Actions</option>
                  <option value="FARMER_APPROVED">FARMER APPROVED</option>
                  <option value="FARMER_REJECTED">FARMER REJECTED</option>
                  <option value="PRODUCT_CREATED">PRODUCT CREATED</option>
                  <option value="PRODUCT_UPDATED">PRODUCT UPDATED</option>
                  <option value="ORDER_CREATED">ORDER CREATED</option>
                  <option value="ORDER_STATUS_CHANGED">ORDER STATUS CHANGED</option>
                  <option value="DISPUTE_CREATED">DISPUTE CREATED</option>
                  <option value="DISPUTE_RESOLVED">DISPUTE RESOLVED</option>
                  <option value="ADMIN_ACTION">ADMIN ACTION</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3">Action</th>
                      <th className="pb-3">Resource</th>
                      <th className="pb-3">Initiated By</th>
                      <th className="pb-3">Details</th>
                      <th className="pb-3 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAuditLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No audit records found matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAuditLogs.map((log) => (
                        <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3">
                            <span className="font-bold text-slate-800">{log.action}</span>
                          </td>
                          <td className="py-3 text-slate-600 font-medium">{log.resourceType}</td>
                          <td className="py-3">
                            <span className="font-semibold text-slate-800">{log.actor?.name || 'System Operator'}</span>
                            <span className="text-[10px] text-slate-400 block">{log.actor?.role}</span>
                          </td>
                          <td className="py-3 text-slate-600 max-w-xs truncate">
                            {JSON.stringify(log.details || {})}
                          </td>
                          <td className="py-3 text-right text-slate-400 text-[11px]">
                            {new Date(log.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* MODAL 1: FARMER INSPECTION MODAL */}
        {/* ============================================================================== */}
        {inspectFarmer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Sprout className="w-5 h-5 text-krishi-600" /> Farmer Verification Dossier
                </h3>
                <button
                  onClick={() => setInspectFarmer(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Farmer Legal Name</span>
                    <span className="font-bold text-slate-900 text-sm">{inspectFarmer.user?.name || inspectFarmer.farmName}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Verification Status</span>
                    <span className="font-bold text-slate-900 text-sm">{inspectFarmer.verificationStatus}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Farm Location</span>
                  <span className="font-semibold text-slate-800">
                    {inspectFarmer.farmLocation?.village || ''} {inspectFarmer.farmLocation?.taluk || ''},{' '}
                    {inspectFarmer.farmLocation?.district}, {inspectFarmer.farmLocation?.state}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Farm Size</span>
                    <span className="font-semibold text-slate-800">{inspectFarmer.farmSizeAcres} Acres</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl">
                    <span className="text-slate-400 font-bold uppercase block text-[10px]">Farming Methodology</span>
                    <span className="font-semibold text-slate-800">{inspectFarmer.farmingMethod}</span>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-slate-400 font-bold uppercase block text-[10px]">Registered Crops</span>
                  <span className="font-semibold text-slate-800">{inspectFarmer.cropTypes?.join(', ') || 'N/A'}</span>
                </div>

                {inspectFarmer.verificationNotes && (
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <span className="text-amber-800 font-bold uppercase block text-[10px]">Verification Notes</span>
                    <span className="font-medium text-amber-900">{inspectFarmer.verificationNotes}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setInspectFarmer(null)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Close Dossier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================================== */}
        {/* MODAL 2: FARMER VERIFICATION APPROVE/REJECT MODAL */}
        {/* ============================================================================== */}
        {verifyModalFarmer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleFarmerVerificationSubmit}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">Authorize Farmer Verification</h3>
                <button
                  type="button"
                  onClick={() => setVerifyModalFarmer(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <p className="text-slate-600">
                  Target Farmer: <span className="font-bold text-slate-900">{verifyModalFarmer.user?.name || verifyModalFarmer.farmName}</span>
                </p>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Decision</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setVerifyStatus('APPROVED')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        verifyStatus === 'APPROVED'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Approve (Grant Publishing)
                    </button>
                    <button
                      type="button"
                      onClick={() => setVerifyStatus('REJECTED')}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        verifyStatus === 'REJECTED'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Reject Application
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Audited Reason / Notes</label>
                  <textarea
                    rows={3}
                    value={verifyNotes}
                    onChange={(e) => setVerifyNotes(e.target.value)}
                    placeholder="Enter compliance or verification details for notification & audit log..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalFarmer(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-krishi-600 hover:bg-krishi-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Submit Decision
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================================== */}
        {/* MODAL 3: CATEGORY CREATE / EDIT MODAL */}
        {/* ============================================================================== */}
        {categoryModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveCategory}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">
                  {editingCategory ? 'Edit Agri Category' : 'Create New Category'}
                </h3>
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={categoryForm.name}
                    onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                    placeholder="e.g. Organic Produce, Dairy, Grains"
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                    placeholder="Category description for farmers and consumers..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-krishi-600 hover:bg-krishi-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================================== */}
        {/* MODAL 4: DISPUTE RESOLUTION MODAL */}
        {/* ============================================================================== */}
        {resolveModalDispute && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <form
              onSubmit={handleResolveDisputeSubmit}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-900">Resolve Consumer Dispute</h3>
                <button
                  type="button"
                  onClick={() => setResolveModalDispute(null)}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="font-bold text-slate-800">{resolveModalDispute.reason.replace(/_/g, ' ')}</div>
                  <div className="text-slate-600 mt-1">{resolveModalDispute.description}</div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Status</label>
                  <select
                    value={disputeResolveStatus}
                    onChange={(e) => setDisputeResolveStatus(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none"
                  >
                    <option value="UNDER_REVIEW">UNDER REVIEW (Investigation started)</option>
                    <option value="RESOLVED">RESOLVED (Customer satisfied / refund issued)</option>
                    <option value="CLOSED">CLOSED (Dismissed / Complete)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Resolution Summary for Notification</label>
                  <textarea
                    rows={3}
                    value={disputeResolveNotes}
                    onChange={(e) => setDisputeResolveNotes(e.target.value)}
                    placeholder="Enter resolution notes sent to consumer..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolveModalDispute(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow"
                >
                  Save Resolution
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;

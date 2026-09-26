import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck, ShoppingBag, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLoginSubmit = async (emailToUse, passwordToUse) => {
    setError('');
    setLoading(true);

    try {
      const res = await login(emailToUse, passwordToUse);
      if (res.success) {
        if (res.user.role === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (res.user.role === 'FARMER') {
          navigate('/farmer/dashboard');
        } else {
          navigate('/marketplace');
        }
      } else {
        setError(res.message || 'Invalid email or password');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginSubmit(email, password);
  };

  const handleQuickDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    handleLoginSubmit(demoEmail, demoPassword);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
        <div className="text-center space-y-1">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-krishi-100 text-krishi-700 rounded-2xl mb-2 shadow-inner">
            <Sprout className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Welcome to Krishi Market</h2>
          <p className="text-xs sm:text-sm text-slate-500">Sign in to your direct agri marketplace account</p>
        </div>

        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Instant Demo Access Panel */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              ⚡ 1-Click Instant Demo Login
            </span>
            <span className="text-[10px] text-krishi-700 font-bold bg-krishi-100 px-2 py-0.5 rounded-full">
              Ready to Test
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('admin@krishimarket.demo', 'Admin@123456')}
              className="p-2.5 bg-white hover:bg-purple-50 text-purple-800 rounded-xl text-xs font-bold border border-purple-200 transition shadow-sm flex flex-col items-center gap-1 hover:border-purple-300 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <span>Admin</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('ramesh.patil@krishimarket.demo', 'Farmer@123456')}
              className="p-2.5 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition shadow-sm flex flex-col items-center gap-1 hover:border-emerald-300 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Farmer</span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('consumer1@krishimarket.demo', 'Consumer@123456')}
              className="p-2.5 bg-white hover:bg-blue-50 text-blue-800 rounded-xl text-xs font-bold border border-blue-200 transition shadow-sm flex flex-col items-center gap-1 hover:border-blue-300 disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <span>Consumer</span>
            </button>
          </div>

          <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-200/60 font-mono">
            <div>👑 <strong>Admin:</strong> admin@krishimarket.demo • Admin@123456</div>
            <div>🌾 <strong>Farmer:</strong> ramesh.patil@krishimarket.demo • Farmer@123456</div>
            <div>🛒 <strong>Consumer:</strong> consumer1@krishimarket.demo • Consumer@123456</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-krishi-500 text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-krishi-500 text-xs sm:text-sm font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-krishi-600 hover:bg-krishi-700 text-white font-black rounded-xl shadow-md transition duration-150 flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to="/signup" className="text-krishi-600 font-bold hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

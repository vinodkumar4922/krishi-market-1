import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sprout, ShoppingBag, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

const Signup = () => {
  const [role, setRole] = useState('CONSUMER'); // 'CONSUMER' or 'FARMER'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  // Farmer specific fields
  const [farmAddress, setFarmAddress] = useState('');
  const [farmDistrict, setFarmDistrict] = useState('');
  const [farmState, setFarmState] = useState('');
  const [farmPincode, setFarmPincode] = useState('');
  const [cropTypes, setCropTypes] = useState('');
  const [farmingMethod, setFarmingMethod] = useState('ORGANIC');
  const [experienceYears, setExperienceYears] = useState('5');
  const [farmSizeAcres, setFarmSizeAcres] = useState('2');

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { signupConsumer, signupFarmer } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (role === 'CONSUMER') {
        const res = await signupConsumer({ name, email, phone, password });
        if (res.success) {
          navigate('/marketplace');
        } else {
          setError(res.message);
        }
      } else {
        const payload = {
          name,
          email,
          phone,
          password,
          farmLocation: {
            address: farmAddress,
            district: farmDistrict,
            state: farmState,
            pincode: farmPincode,
          },
          cropTypes: cropTypes.split(',').map((c) => c.trim()).filter(Boolean),
          farmingMethod,
          experienceYears: Number(experienceYears),
          farmSizeAcres: Number(farmSizeAcres),
        };

        const res = await signupFarmer(payload);
        if (res.success) {
          setSuccessMsg('Account created! Your farmer verification status is PENDING admin review.');
          setTimeout(() => {
            navigate('/farmer/dashboard');
          }, 1500);
        } else {
          setError(res.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white rounded-2xl border border-slate-200 shadow-xl p-8">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-black text-slate-900">Join Krishi Market</h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose your account type to get started
          </p>
        </div>

        {/* Role Toggle Tabs */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-1.5 bg-slate-100 rounded-xl">
          <button
            type="button"
            onClick={() => setRole('CONSUMER')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
              role === 'CONSUMER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            I am a Consumer
          </button>
          <button
            type="button"
            onClick={() => setRole('FARMER')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${
              role === 'FARMER'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sprout className="w-4 h-4 text-krishi-600" />
            I am a Farmer
          </button>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ramesh Patel"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 9876543210"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
              />
            </div>
          </div>

          {/* Farmer Dedicated Fields */}
          {role === 'FARMER' && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div className="bg-krishi-50 p-3 rounded-xl border border-krishi-200 text-xs text-krishi-800 font-medium">
                🌾 Notice: All registered farmers undergo administrative verification before product listings are published live to consumers.
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Farm Address & Village
                </label>
                <input
                  type="text"
                  required
                  value={farmAddress}
                  onChange={(e) => setFarmAddress(e.target.value)}
                  placeholder="Plot 42, Green Valley Farm, Post Kalwan"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    required
                    value={farmDistrict}
                    onChange={(e) => setFarmDistrict(e.target.value)}
                    placeholder="Nashik"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    required
                    value={farmState}
                    onChange={(e) => setFarmState(e.target.value)}
                    placeholder="Maharashtra"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    required
                    value={farmPincode}
                    onChange={(e) => setFarmPincode(e.target.value)}
                    placeholder="422003"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Primary Crops / Harvests (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  value={cropTypes}
                  onChange={(e) => setCropTypes(e.target.value)}
                  placeholder="Alphonso Mangoes, Onions, Spinach, Wheat"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Farming Method
                  </label>
                  <select
                    value={farmingMethod}
                    onChange={(e) => setFarmingMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm font-medium"
                  >
                    <option value="ORGANIC">Organic (Certified/Natural)</option>
                    <option value="NATURAL">Natural / ZBNF</option>
                    <option value="CONVENTIONAL">Conventional</option>
                    <option value="HYDROPONIC">Hydroponic</option>
                    <option value="PERMACULTURE">Permaculture</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Experience (Yrs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Farm Area (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={farmSizeAcres}
                    onChange={(e) => setFarmSizeAcres(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-krishi-500 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 py-3 bg-krishi-600 hover:bg-krishi-700 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : `Register as ${role === 'FARMER' ? 'Farmer' : 'Consumer'}`}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-krishi-600 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;

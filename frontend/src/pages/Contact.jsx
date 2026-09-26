import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import api from '../services/api';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'GENERAL',
    subject: '',
    message: '',
  });

  const [loading, setLoading] = useState(false);
  const [successResponse, setSuccessResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in your name, email, and message.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await api.post('/contact', formData);
      if (res.data.success) {
        setSuccessResponse(res.data);
        setFormData({
          name: '',
          email: '',
          phone: '',
          category: 'GENERAL',
          subject: '',
          message: '',
        });
      } else {
        setErrorMessage(res.data.message || 'Unable to submit your inquiry. Please try again.');
      }
    } catch (err) {
      setErrorMessage(
        err.response?.data?.message || 'A network error occurred. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="px-3.5 py-1.5 rounded-full bg-krishi-100 text-krishi-800 text-xs font-black uppercase tracking-wider border border-krishi-200">
          Support & Communications
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
          We’re Here to Help Our Farmers and Consumers
        </h1>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Have questions regarding farmer onboarding, harvest schedules, delivery slots, or order quality? Connect directly with our team.
        </p>
      </div>

      {/* Main Grid: Support Info + Contact Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Contact Information & Channels */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl space-y-6">
            <h2 className="text-xl font-black text-white">Direct Support Channels</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Our regional operations desks in Karnataka coordinate harvest logistics and consumer customer service 7 days a week.
            </p>

            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-krishi-600/30 border border-krishi-500/40 flex items-center justify-center text-krishi-400 flex-shrink-0 mt-0.5">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Kisan Helpline (Toll-Free)</span>
                  <a href="tel:1800-KRISHI-00" className="text-sm font-black text-white hover:text-krishi-400 transition">
                    +91 1800-KRISHI-00
                  </a>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Mon–Sun: 7:00 AM – 8:00 PM IST</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-krishi-600/30 border border-krishi-500/40 flex items-center justify-center text-krishi-400 flex-shrink-0 mt-0.5">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Official Email</span>
                  <a href="mailto:support@krishimarket.demo" className="text-sm font-black text-white hover:text-krishi-400 transition">
                    support@krishimarket.demo
                  </a>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Typical response within 24 hours</span>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-krishi-600/30 border border-krishi-500/40 flex items-center justify-center text-krishi-400 flex-shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Regional Logistics Hub</span>
                  <p className="text-xs text-slate-300 leading-snug">
                    APMC Yard Road, Krishi Bhavan Complex, Hubballi-Dharwad, Karnataka 580020
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Issue Reporting Notice */}
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              <span>Received damaged or missing produce?</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              If your order was delivered and items are bruised or missing, you can file a direct Dispute Ticket from your Orders page for priority resolution.
            </p>
            <Link
              to="/orders"
              className="inline-block text-xs font-bold text-amber-900 underline hover:text-amber-700"
            >
              Go to My Orders to Raise Dispute →
            </Link>
          </div>
        </div>

        {/* Form Container */}
        <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Send us a Message</h2>
            <p className="text-xs text-slate-500 mt-1">
              Fill out the form below and an agricultural logistics specialist will assist you promptly.
            </p>
          </div>

          {successResponse ? (
            <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-4 animate-in fade-in">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-extrabold text-emerald-950">Inquiry Received Successfully</h3>
                <p className="text-xs text-emerald-800 leading-relaxed">{successResponse.message}</p>
              </div>
              {successResponse.data?.ticketId && (
                <div className="inline-block bg-white px-4 py-2 rounded-xl border border-emerald-300 text-xs font-mono font-bold text-emerald-900">
                  Ticket Reference: {successResponse.data.ticketId}
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSuccessResponse(null)}
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition"
                >
                  Submit Another Inquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Patil"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="e.g. ramesh@example.com"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Inquiry Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none bg-white"
                  >
                    <option value="GENERAL">General Information</option>
                    <option value="FARMER_ONBOARDING">Farmer Registration & Verification</option>
                    <option value="ORDER_DELIVERY">Order Status & Delivery Slots</option>
                    <option value="QUALITY_DISPUTE">Produce Quality & Returns</option>
                    <option value="TECHNICAL_BUG">Website / App Technical Issue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subject (Optional)
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Summary of your inquiry..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Please provide details regarding your inquiry or issue..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-krishi-600 hover:bg-krishi-700 text-white font-extrabold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting Inquiry...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Quick FAQ Reference */}
      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-krishi-700 font-bold text-xs uppercase tracking-wider">
            <HelpCircle className="w-4 h-4" />
            <span>Need an instant answer?</span>
          </div>
          <h3 className="text-lg font-black text-slate-900">Check our comprehensive Knowledge Base & FAQ</h3>
          <p className="text-xs text-slate-500 max-w-xl">
            We’ve documented answers for farmer verification standards, multi-farmer carts, morning express delivery slots, and refund policies.
          </p>
        </div>
        <Link
          to="/faq"
          className="px-6 py-2.5 bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-100 transition whitespace-nowrap shadow-sm"
        >
          View All FAQs
        </Link>
      </div>
    </div>
  );
};

export default Contact;

import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, ShieldCheck, Heart, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-krishi-600 flex items-center justify-center text-white shadow-md">
                <Sprout className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1">
                  KRISHI <span className="text-krishi-400">MARKET</span>
                </span>
                <span className="text-[10px] block font-medium uppercase tracking-wider text-slate-400 -mt-1">
                  Direct Farmer-to-Consumer
                </span>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              Empowering regional farmers with fair compensation (+38.5% price realization) and delivering fresh, chemical-free farm produce directly to consumers.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/marketplace" className="hover:text-krishi-400 transition">Marketplace</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-krishi-400 transition">Our Mission & Story</Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-krishi-400 transition">Frequently Asked Questions</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-krishi-400 transition">Contact & Helpdesk</Link>
              </li>
              <li>
                <Link to="/signup" className="hover:text-krishi-400 transition">Join as a Farmer</Link>
              </li>
            </ul>
          </div>

          {/* Trust & Security */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Platform Assurance</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-krishi-400 flex-shrink-0" />
                <span>Verified Agricultural Producers</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-krishi-400 flex-shrink-0" />
                <span>Zero Middleman Markups</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-krishi-400 flex-shrink-0" />
                <span>100% Traceable Harvests</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Support & Logistics</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-krishi-400" />
                <span>support@krishimarket.demo</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-krishi-400" />
                <span>+91 1800-KRISHI-00</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-krishi-400" />
                <span>Regional Agri Hub, Karnataka</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Krishi Market Platform. Direct Farmer-to-Consumer Agri Marketplace.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" /> for Indian Agriculture
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

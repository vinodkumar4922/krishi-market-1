import React, { useState } from 'react';
import { ChevronDown, HelpCircle, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const [search, setSearch] = useState('');

  const faqs = [
    {
      category: 'Farmer Registration & Verification',
      q: 'How do farmers register on Krishi Market?',
      a: 'Farmers sign up with their phone number, farm location (district, taluk, village), farm acreage, farming methodology (Organic, Natural, or Conventional), and primary crop types. Profiles remain in PENDING status until administrative verification.',
    },
    {
      category: 'Farmer Registration & Verification',
      q: 'What is the farmer verification process?',
      a: 'Krishi Market administrators review land documentation, organic certifications (where applicable), and regional agricultural department records. Only APPROVED farmers can publish harvest listings and accept orders, preventing fraudulent resellers.',
    },
    {
      category: 'Ordering & Multi-Farmer Carts',
      q: 'Can I order produce from multiple farmers in a single cart?',
      a: 'Yes! Krishi Market supports multi-farmer carts. You can combine organic tomatoes from Vijayapura, mangoes from Dharwad, and A2 milk from Bagalkot in one checkout. The platform coordinates consolidation and delivers everything in a unified morning slot.',
    },
    {
      category: 'Organic Products & Certification',
      q: 'How is organic authenticity guaranteed?',
      a: 'Products labeled Organic must come from verified organic farmers who use zero synthetic chemical pesticides or fertilizers. Listings display explicit farming methods (Organic, Natural, Permaculture, Conventional) and harvest dates.',
    },
    {
      category: 'Delivery & Morning Express Slots',
      q: 'How does delivery scheduling work?',
      a: 'Consumers select a convenient delivery slot during checkout (such as Morning Express 07:00 AM - 10:00 AM). Produce is picked farm-fresh to order and delivered in specialized temperature-controlled supply vehicles.',
    },
    {
      category: 'Reviews & Purchase Gating',
      q: 'Can anyone write reviews on Krishi Market?',
      a: 'No. To maintain complete integrity and eliminate fake reviews, only verified consumers who placed an order that was successfully DELIVERED can review that specific produce item and farmer. Duplicate reviews on the same order item are strictly prevented.',
    },
    {
      category: 'Inventory & Stock Availability',
      q: 'What happens if a product goes out of stock or becomes unavailable?',
      a: 'Krishi Market uses atomic inventory tracking. If a product reaches 0 stock, its status dynamically switches to OUT_OF_STOCK and it cannot be purchased. If weather prevents harvesting, farmers mark produce as UNAVAILABLE, and consumers are notified.',
    },
    {
      category: 'Disputes, Refunds & Quality Resolution',
      q: 'What if I receive damaged or poor quality produce?',
      a: 'Consumers can raise a dispute directly from their order page under categories like Product Quality, Quantity Issue, or Delivery Delay. Krishi Market administrators review the claim, communicate with the grower, and issue wallet refunds or replacement deliveries.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(search.toLowerCase()) ||
      item.a.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="text-center space-y-3">
        <span className="px-3.5 py-1.5 rounded-full bg-krishi-100 text-krishi-800 text-xs font-black uppercase tracking-wider border border-krishi-200">
          Knowledge Base
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
          Everything you need to know about farmer verification, fresh harvest ordering, delivery slots, and customer dispute resolution.
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto pt-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-6.5" />
          <input
            type="text"
            placeholder="Search questions by keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs focus:ring-2 focus:ring-krishi-500 focus:outline-none shadow-sm"
          />
        </div>
      </div>

      {/* Accordion */}
      <div className="space-y-4">
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No questions found matching your search.
          </div>
        ) : (
          filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-krishi-600 block mb-1">
                      {faq.category}
                    </span>
                    <span className="text-sm font-extrabold text-slate-900">{faq.q}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-krishi-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="p-5 pt-0 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Contact CTA */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-center space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Still have questions?</h3>
        <p className="text-xs text-slate-500">
          Our dedicated agricultural support team is here to assist farmers and consumers alike.
        </p>
        <Link
          to="/contact"
          className="inline-block px-5 py-2 bg-krishi-600 hover:bg-krishi-700 text-white rounded-xl text-xs font-bold shadow transition"
        >
          Contact Support Team
        </Link>
      </div>
    </div>
  );
};

export default FAQ;

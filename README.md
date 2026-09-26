# 🌱 KRISHI MARKET — Direct Farmer-to-Consumer Agri Marketplace

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-v8-purple.svg)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-v8-brightgreen.svg)](https://www.mongodb.com/)
[![Test Suites](https://img.shields.io/badge/Tests-122%20Passed-success.svg)](./scripts/verify.sh)

> **"Buy Fresh. Support Farmers."**  
> A production-ready, disintermediated digital agricultural commerce platform designed to give regional farmers fair price realization (+38.5%) and deliver wholesome, chemical-free harvests directly to consumers within 24 hours.

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [Problem Statement](#-problem-statement)
3. [The Krishi Market Solution](#-the-krishi-market-solution)
4. [Core Features](#-core-features)
5. [System Architecture](#-system-architecture)
6. [Technology Stack](#-technology-stack)
7. [Repository Folder Structure](#-repository-folder-structure)
8. [Installation & Local Setup](#-installation--local-setup)
9. [Environment Configuration](#-environment-configuration)
10. [Database Setup & In-Memory Auto-Start](#-database-setup--in-memory-auto-start)
11. [Realistic Demo Dataset & Credentials](#-realistic-demo-dataset--credentials)
12. [Testing & Verification Commands](#-testing--verification-commands)
13. [Security & Pentesting Architecture](#-security--pentesting-architecture)
14. [Deployment Guide](#-deployment-guide)
15. [Future Roadmap](#-future-roadmap)
16. [License & Acknowledgments](#-license--acknowledgments)

---

## 🌾 Project Overview
**Krishi Market** connects smallholder and organic farmers in regional belts (starting with Karnataka's hubs like Vijayapura, Dharwad, Bagalkot, and Kolar) directly with households. The platform removes predatory commission agents, enforces transparent farm-gate pricing, and guarantees harvest traceability with morning express delivery windows.

---

## 🛑 Problem Statement
- **Middleman Cartels:** Intermediaries and wholesale aggregators skim 40%–60% of the end retail price.
- **Distress Sales:** Lack of direct consumer market access forces cultivators to sell perishable produce below cultivation cost.
- **Stale Food Supply:** Produce spends 3–5 days in transit across multiple distribution hubs, losing vital freshness and nutrients.
- **Zero Transparency:** Consumers pay high retail prices without knowing the grower, harvest date, or chemical history.

---

## ✨ The Krishi Market Solution
- **+38.5% Price Realization:** Farmers set their own produce prices and keep the full revenue margin.
- **Harvest-Within-24h Guarantee:** Produce is harvested directly to order and delivered at peak freshness.
- **Multi-Farmer Consolidated Cart:** Consumers order from multiple farmers in one checkout with a single delivery slot.
- **Authoritative Server Pricing:** Eliminates price tampering; line items and totals are computed strictly from the active database.
- **Verified Purchase Reviews:** Strict rating gating ensures only verified buyers of delivered items can post reviews.

---

## 🚀 Core Features

### For Consumers:
- **Produce Discovery:** Faceted search by crop, category, farming method (Organic, Natural, Conventional), and price.
- **Farmer Storefronts:** Detailed farmer profiles with verification badges, land size, farming methods, and story.
- **Multi-Farmer Cart:** Combine tomatoes from Farmer A and mangoes from Farmer B in a single morning delivery.
- **Order State Machine:** Real-time visual tracking from `PLACED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY_FOR_DELIVERY` $\rightarrow$ `OUT_FOR_DELIVERY` $\rightarrow$ `DELIVERED`.
- **Dispute Redressal:** Raise tickets for quality issues or delivery delays directly from the order page.
- **Wishlist & Recently Viewed:** Save favorite produce and track browsing history.

### For Farmers:
- **Self-Service Hub:** Complete farm profiles, register acreage, and submit verification documents.
- **Produce & Inventory CRUD:** Manage listings, harvest dates, minimum order quantities, and unit pricing.
- **Atomic Stock Management:** Real-time stock status (`IN_STOCK`, `LOW_STOCK`, `OUT_OF_STOCK`, `UNAVAILABLE`).
- **Fulfillment Console:** Stepwise order processing with real-time status progression.
- **Sales Analytics:** Track total revenue, fulfilled orders, and average ratings.

### For Administrators:
- **Farmer Verification Queue:** Audit farm documentation and approve/reject growers with automated notifications.
- **Platform Analytics:** Real-time database metrics for total volume, commission, repeat buyer rate, and fulfillment rate.
- **Dispute Adjudication:** Review consumer dispute tickets, communicate with farmers, and execute refund resolutions.
- **Security Audit Logs:** Tamper-evident activity trail with IP addresses and user agents.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA Frontend (Vite)                │
│       Landing • Marketplace • Farmer Hub • Admin Console    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST API
┌──────────────────────────────▼──────────────────────────────┐
│                    Express.js Backend API                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Security: Helmet • RateLimit • MongoSanitize • CORS   │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Auth & RBAC: JWT HS256 • Role Guards • IDOR Guards    │  │
│  ├───────────────────────────────────────────────────────┤  │
│  │ Business Logic: Authoritative Pricing • Atomic Stock  │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Mongoose ODM
┌──────────────────────────────▼──────────────────────────────┐
│                       MongoDB Database                      │
│     Users • Farmers • Products • Orders • Reviews • Audit   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💻 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, Tailwind CSS, Lucide React, Axios, React Router v7 |
| **Backend** | Node.js (v18+), Express.js (v4.21), Mongoose (v8.10) |
| **Security** | Helmet (v8.0), express-mongo-sanitize, express-rate-limit, bcryptjs |
| **Database** | MongoDB (Local / Atlas / In-Memory Memory Server) |
| **Testing** | Jest (v29.7), Supertest (v7.0) |

---

## 📁 Repository Folder Structure

```
Krishi-Market-main/
├── backend/
│   ├── src/
│   │   ├── config/             # DB connection & seed scripts
│   │   ├── controllers/        # Business logic controllers
│   │   ├── middleware/         # Auth, RBAC, RateLimit, Sanitize
│   │   ├── models/             # Mongoose schemas & indexes
│   │   ├── routes/             # Express API routes
│   │   ├── scripts/            # Comprehensive demo seeder
│   │   ├── utils/              # Calculation helpers & logger
│   │   └── server.js           # Server entry point
│   ├── tests/                  # 7 automated test suites (122 tests)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/         # Navbar, Footer, Cards, Modals
│   │   ├── context/            # AuthContext & CartContext
│   │   ├── pages/              # Landing, Marketplace, About, FAQ, Contact, etc.
│   │   ├── routes/             # AppRoutes with React.lazy code splitting
│   │   └── services/           # Axios HTTP client instance
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── docs/
│   └── TECHNICAL_DOCUMENTATION.md # 28-section technical specification
├── scripts/
│   └── verify.sh               # Full verification & test runner
├── .env.example                # Root environment template
└── README.md                   # Platform documentation
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/vinodkumar4922/krishi-market-1.git
cd Krishi-Market-main

# Install Backend Dependencies
cd backend
npm install

# Install Frontend Dependencies
cd ../frontend
npm install
cd ..
```

---

## 🔐 Environment Configuration

Create `.env` in the root (or `backend/.env` and `frontend/.env.local`):

```bash
cp .env.example .env
```

Key environment variables:
```ini
# Backend
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/krishi_market
JWT_SECRET=krishi-market-development-jwt-access-secret-2026
JWT_REFRESH_SECRET=krishi-market-development-jwt-refresh-secret-2026
CLIENT_URL=http://localhost:5173

# Frontend
VITE_API_BASE_URL=http://localhost:5001/api
```

*(Note: If `MONGODB_URI` is left blank in local development, Krishi Market automatically boots an embedded MongoDB Memory Server for zero-dependency development!)*

---

## 📦 Database Setup & In-Memory Auto-Start

To seed the realistic demo dataset (farmers, produce, active orders, verified reviews):
```bash
cd backend
npm run seed:demo
```

To purge and reset all demo records:
```bash
npm run reset:demo
```

---

## 👥 Realistic Demo Dataset & Credentials

| Role | Account Email | Password | Access Details |
| :--- | :--- | :--- | :--- |
| **👑 Admin** | `admin@krishimarket.demo` | `DemoPassword123!` | Platform Governance, Verifications, Disputes, Audit Logs |
| **🌾 Farmer (Organic)** | `ramesh.patil@farmer.demo` | `DemoPassword123!` | Certified Organic Farmer (Vijayapura, Karnataka) |
| **🌾 Farmer (Conventional)** | `suresh.gowda@farmer.demo` | `DemoPassword123!` | Conventional Farmer (Bengaluru Rural) |
| **🌾 Farmer (Pending)** | `basavaraj.jangam@farmer.demo` | `DemoPassword123!` | Demonstrates Admin Verification Approval Queue |
| **🛒 Consumer** | `anita.sharma@consumer.demo` | `DemoPassword123!` | Buyer with active order history and delivery slots |

---

## 🧪 Testing & Verification Commands

Krishi Market includes a comprehensive test suite of **122 automated tests** across 7 test suites:

```bash
# Run the complete test suite
cd backend
npm test

# Run full project verification (backend tests + frontend production build)
./scripts/verify.sh
```

### Test Suite Breakdown:
1. `tests/auth.test.js`: Token validation, registration, login, role issuance.
2. `tests/farmer_product_marketplace.test.js`: Farmer verification, product CRUD, search, and filters.
3. `tests/purchasing_and_orders_e2e.test.js`: Authoritative cart calculations, delivery slots, atomic stock decrement.
4. `tests/business_and_security.test.js`: Price tampering rejection, IDOR prevention, review gating.
5. `tests/admin_governance_e2e.test.js`: Admin verification, dispute resolution, mathematical KPI derivation.
6. `tests/security_and_penetration.test.js`: NoSQL injection defense, rate-limiting, file upload hardening.
7. `tests/complete_marketplace_journey_e2e.test.js`: Complete 18-step end-to-end journey from registration to analytics update.

---

## 🛡️ Security & Pentesting Architecture

- **IDOR / BOLA Prevention:** Every mutating request validates user ownership against the targeted resource ID.
- **NoSQL Injection Immunity:** `express-mongo-sanitize` strips `$` and `.` operators on all incoming payloads.
- **Server-Authoritative Pricing:** Client-submitted line item prices and totals are discarded; recalculation is forced directly against database prices.
- **Atomic Concurrency Protection:** Stock deductions employ MongoDB conditional `$inc: { quantity: -qty }` queries with `$gte` boundaries to eliminate race conditions.
- **Magic Byte File Validation:** Uploaded produce images are inspected for binary magic bytes (JPEG/PNG/WebP), size-capped at 5MB, and renamed with UUIDs.
- **Rate-Limiting:** IP-based rate limiting on authentication routes (30/15min) and support contact forms (10/15min).

---

## 🚀 Deployment Guide

### Frontend (Vercel or Netlify)
- **Root Directory:** `frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Environment Variables:** `VITE_API_BASE_URL=https://api.yourdomain.com/api`
- Pre-configured `vercel.json` and `netlify.toml` provide instant SPA routing and security headers.

### Backend (Node.js / Render / Railway / AWS)
- **Root Directory:** `backend`
- **Build Command:** `npm install --omit=dev`
- **Start Command:** `npm start`
- **Environment Variables:** See [Environment Configuration](#-environment-configuration). Ensure production MongoDB Atlas URI and secure JWT secrets are set.

---

## 🗺️ Future Roadmap
- [ ] Regional language localization (Kannada, Hindi, Marathi).
- [ ] Direct UPI / Razorpay payment gateway integration.
- [ ] SMS & WhatsApp delivery notification webhooks.
- [ ] Machine learning-based mandi price forecasting and harvest yield predictions.
- [ ] Offline Progressive Web App (PWA) mode for low-connectivity farm regions.

---

## 📄 License & Acknowledgments
Licensed under the [MIT License](LICENSE).  
Built with dedicated support for Indian agriculture and regional smallholder cultivators.

# Emotion Delivery Platform — Local Run Instructions

This repository contains a Next.js frontend and an Express/MongoDB backend.

Prerequisites:
- Node.js (>=18) and npm
- MongoDB (local) or MongoDB Atlas connection string

Run backend (API):

1. Open a terminal, go to `backend`:

```bash
cd backend
npm install
```

2. Create an `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env to add your MongoDB URI and secrets
```

3. Start the backend in development mode:

```bash
npm run dev
```

The API will be available at `http://localhost:5000` (or `PORT` in `.env`). Check `http://localhost:5000/health`.

Run frontend (Next.js):

1. Open another terminal, go to `frontend`:

```bash
cd frontend
npm install
npm run dev
```

2. The dev frontend will run at `http://localhost:3000` by default.

Notes:
- If you prefer a single command to run both apps, install `concurrently` globally or add a root `package.json` with the `concurrently` dependency.
- Some backend features (payments, email, SMS) require provider credentials — add them to `.env` before using those endpoints.

Files added for convenience:
- `backend/.env.example` — environment variable template
# 🎁 Emotion Delivery Platform

> **Hyper-local personalised gifting startup** — MERN stack with Razorpay payments, Google Maps live tracking, WhatsApp/Email/SMS notifications, and an AI-powered gift recommendation engine.

---

## 📁 Project Structure

```
emotion-delivery-platform/
├── backend/                        # Node.js + Express API
│   ├── config/
│   │   ├── db.js                   # MongoDB connection (Mongoose)
│   │   └── razorpay.js             # Razorpay SDK singleton
│   ├── models/
│   │   ├── User.js                 # Auth + profile schema
│   │   ├── MemoryVault.js          # Personal CRM schema
│   │   └── Order.js                # Full order schema
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── memoryVaultController.js
│   │   ├── recommendationController.js
│   │   └── orderController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── memoryVaultRoutes.js
│   │   ├── recommendationRoutes.js
│   │   └── orderRoutes.js
│   ├── middleware/
│   │   ├── authMiddleware.js       # JWT + RBAC
│   │   └── errorHandler.js        # Centralised error handler
│   ├── services/
│   │   ├── notificationService.js  # WhatsApp + SMS + Email
│   │   ├── aiService.js            # Tag-based recommendation engine
│   │   └── qrService.js            # QR code generation
│   ├── .env.example
│   ├── package.json
│   └── server.js                   # Express entry point
│
└── frontend/                       # Next.js + Tailwind + Framer Motion
    └── src/
        ├── api/axiosClient.js      # Axios + JWT interceptors
        ├── context/
        │   ├── AuthContext.jsx     # Auth state
        │   └── CartContext.jsx     # Cart reducer
        ├── components/
        │   ├── MemoryVault/
        │   │   ├── MemoryVaultDashboard.jsx
        │   │   └── MilestoneCard.jsx
        │   ├── GiftBoxBuilder/
        │   │   ├── GiftBoxBuilder.jsx        # 4-step orchestrator
        │   │   ├── StepProductSelect.jsx     # Step 1
        │   │   ├── StepPackaging.jsx         # Step 2
        │   │   ├── StepHandwrittenLetter.jsx # Step 3
        │   │   └── StepVideoQR.jsx           # Step 4
        │   └── Checkout/
        │       ├── CheckoutPage.jsx          # Razorpay + address + slots
        │       └── OrderTracker.jsx          # Google Maps + timeline
        ├── pages/
        │   ├── vault.jsx
        │   ├── build.jsx
        │   ├── checkout.jsx
        │   └── track/[id].jsx
        └── styles/globals.css
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)
- Razorpay account (test keys)
- Twilio account (WhatsApp Sandbox + SMS)
- Gmail account with App Password enabled
- Google Maps API key

### 1. Backend Setup

```bash
cd backend
cp .env.example .env        # Fill in your credentials
npm install
npm run dev                 # Starts on port 5000
```

### 2. Frontend Setup

```bash
cd frontend
cp .env.local.example .env.local   # Fill in your credentials
npm install
npm run dev                         # Starts on port 3000
```

---

## 🔑 Key API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register + auto-create Memory Vault |
| `POST` | `/api/auth/login` | Login + return JWT |
| `GET`  | `/api/memory-vault` | Get full vault with upcoming milestones |
| `POST` | `/api/memory-vault/add` | Add relation / milestone / past gift |
| `GET`  | `/api/recommendations` | AI-powered gift recommendations |
| `POST` | `/api/orders/create-razorpay-order` | Create Razorpay order |
| `POST` | `/api/orders/checkout` | Verify payment + persist order + notify |
| `GET`  | `/api/orders/tracking/:id` | Live tracking coordinates |

---

## ✨ Feature Highlights

### 🧠 AI Recommendation Engine
- Tag-based scoring across relation type, occasion, preference history, and budget
- Weights: Tags (65%) + Budget proximity (20%) + Rating (15%)
- Excludes recently gifted products to encourage variety
- Upgradeable to OpenAI / Gemini with a single service swap

### 🔐 Payment Security
- Server-side Razorpay signature verification using `HMAC-SHA256`
- Duplicate payment idempotency check on `razorpayPaymentId`
- No sensitive keys exposed to the frontend

### 📦 Memory Vault
- One Vault per user (auto-created on registration)
- `upcomingMilestones` virtual — computed in-memory across all relations
- "One-Click Reorder" — AI picks the top recommendation and adds to cart instantly

### 🎥 Video QR Code
- QR generated server-side using `qrcode` npm library
- High error correction level (`H`) — survives gift wrapping wear
- Deep navy + white theme to match brand

### 🔔 Notifications
- All three channels fire in parallel with `Promise.allSettled` (non-blocking)
- Graceful failure — notification errors never crash an order

---

## 🔧 Production Checklist

- [ ] Replace `.env` values with production credentials
- [ ] Set `NODE_ENV=production`
- [ ] Add S3 bucket for video file uploads
- [ ] Replace AI mock catalogue with real Product model + MongoDB
- [ ] Add webhook endpoint for Razorpay refund events
- [ ] Deploy backend to Railway / Render / EC2
- [ ] Deploy frontend to Vercel
- [ ] Set up a cron job for birthday reminder notifications

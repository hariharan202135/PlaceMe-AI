# PlaceMe AI - Complete SaaS Placement Prep Platform

PlaceMe AI is a production-ready SaaS placement preparation platform built with a high-performance stack targeting elite service and consulting IT placements (TCS, Infosys, Wipro, Accenture, Deloitte, etc.).

---

## Technical Architecture Overview

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts (Radar/Timeline visual metrics), Framer Motion. Uses Axios with credentials for HttpOnly cookie session handshakes.
- **Backend**: Node.js + Express.js, TypeScript, Mongoose (MongoDB Atlas), JWT (cookie-parser secure storage), cryptographically verified Razorpay checkouts, and Gemini AI.
- **AI Integrations**: Uses Gemini (`gemini-1.5-flash`) for real-time ATS resume screening and HR mock interview scoring/solutions.
- **Sandbox Code Compiler**: Child process script execute pipeline supporting Java, Python, C, C++, and JS code submissions against hidden test cases. Includes logical validation fallbacks if local compilers are absent.

---

## Project Structure

```text
PlaceMe AI/
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, API configs
│   │   ├── controllers/     # Controller logic (Auth, Prep, MockTests, AI Resume, AI HR, Coding, Payments, Admin)
│   │   ├── middlewares/     # Authentication, Admin gates, Premium locks
│   │   ├── models/          # Mongoose collections (User, Question, Category, MockTest, TestResult, etc.)
│   │   ├── routes/          # API endpoint routes
│   │   └── utils/           # Sandbox execution runner, Gemini promt helper, Seeder script
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── app/             # App Router pages (Dashboard, Mocks, Playgrounds, AI HR, ATS Resume, Billing, Admin)
│   │   ├── components/      # UI Layout wrappers
│   │   ├── context/         # AuthProvider & ThemeProvider
│   │   └── lib/             # Axios API client
│   └── tailwind.config.ts
├── docker-compose.yml
└── README.md
```

---

## Quick Start Guide

### Prerequisites
- Node.js 20+ installed
- MongoDB installed locally or MongoDB Atlas connection URI
- (Optional) Gemini API Key & Razorpay credentials

### Environment Configurations

#### 1. Backend (`backend/.env`)
Create a `.env` file in the `backend/` folder:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/placeme_ai
JWT_SECRET=super_secret_jwt_key_for_placeme_ai_production
GEMINI_API_KEY=your_real_gemini_api_key   # defaults to mock if omitted
RAZORPAY_KEY_ID=your_razorpay_key_id      # defaults to mock if omitted
RAZORPAY_KEY_SECRET=your_razorpay_secret  # defaults to mock if omitted
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

#### 2. Frontend (`frontend/.env.local`)
Create a `.env.local` file in the `frontend/` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

---

## Installation & Running Locally

### Step 1: Start Backend
```bash
cd backend
npm install
npm run dev
```
*Note: The backend will automatically verify if the database is empty and seed standard quantitative/logical questions, coding problems (with test cases), and full TCS/Wipro mock test templates.*

### Step 2: Start Frontend
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` to view the application.

---

## Sandbox Testing Credentials
- **Free Account Registration**: Create any account on the `/auth/register` screen.
- **Admin Control Bypass**: Use the seeder log or update your role directly in MongoDB (`role: 'admin'`) or assign role manually inside the User Manager tab in the Admin panel.
- **Mock Razorpay checkout**: Select any Monthly (₹29) or Yearly (₹199) plan on the Billing screen. The client will detect default keys and prompt you with a simulated checkout overlay. Click **Simulate Success** to update plans locally.
- **Gemini evaluations**: If you run without a real key, the code handles evaluations locally, scoring verbal answers based on length and checking coding problems against algorithmic tokens.

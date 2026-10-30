# SafarSathi - Bus Ticket Booking Platform

A modern, full-stack Bus Ticket Booking platform migrated from legacy static HTML & Node.js to **React.js (Vite)** + **PHP 8+ REST API** + **MySQL Database**, engineered for high reliability, concurrency-safe transactions, and deployment on **Hostinger PHP hosting**.

---

## 🚀 Key Features

1. **Interactive Bus Search & Discovery**:
   - Fast route search with origin, destination, journey date, and bus type filters.
   - Interactive location swap (⇄) with animation.
   - Popular route direct links (Mumbai ➔ Goa, Delhi ➔ Manali, Bangalore ➔ Chennai, etc.).
   - Dynamic price range slider and bus type filtering (AC, Sleeper, Seater).

2. **Real-Time 24-Seat Layout Selection**:
   - 24-seat bus grid layout with central aisle.
   - Dedicated pink-accented female-reserved seats (full left column: S1, S5, S9, S13, S17, S21).
   - Real-time occupied seat detection from MySQL database.
   - **Temporary 10-Minute Seat Hold Mechanism** to prevent race conditions and double booking during checkout.

3. **Passenger Details & Travel Add-ons**:
   - Dynamic multi-passenger input forms generated per selected seat (Name, Age, Gender).
   - Pre-fills details from logged-in user profile.
   - Optional travel add-ons with real-time fare calculation:
     - 🧳 Extra Baggage (+15kg) - ₹150
     - 🛡️ Comprehensive Travel Insurance - ₹49
     - 🥪 Snacks & Beverage Box - ₹99

4. **SafarSathi Wallet & Multi-Method Payment**:
   - Integrated digital wallet with instant debit and cancellation refund credits.
   - Promotional coupons (`FIRST50` - ₹200 off, `TRAVELGO` - ₹150 off, `FESTIVE300`).
   - Multiple payment tabs: SafarSathi Wallet, UPI QR Code, UPI ID (VPA), Credit/Debit Card, Net Banking.
   - 10-minute hold countdown timer with automatic seat release if abandoned.

5. **My Bookings & E-Ticket Management**:
   - Tabbed view: `ALL`, `UPCOMING`, `COMPLETED`, `CANCELLED`.
   - Dynamic E-Ticket generation with unique PNR and scannable QR Code.
   - Native Print Ticket (`window.print()`) and PDF preview.
   - One-click ticket cancellation with **instant automatic wallet refund**.
   - Star rating and journey feedback submission.

6. **Admin Fleet Operations Portal**:
   - KPI Dashboard: Total Confirmed Revenue, Total Bookings, Fleet Count, Registered Customers.
   - Add new bus to fleet & schedule with custom departure/arrival times, fare, and amenities.
   - Manage and delete fleet buses, users, registered bus operators, and travel agents.

7. **Partner Registrations & Informational Pages**:
   - Dedicated Bus Operator registration portal (`/register-operator`).
   - Travel Agent partner registration portal (`/register-agent`).
   - Company & support pages: About Us, Help & Support, Careers, Advertise, Affiliate, Press, Science.

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|---|---|
| **Frontend** | React 18, Vite, React Router v6, Context API, CSS3 |
| **Backend** | PHP 8.0+ REST APIs, Object-Oriented PDO, Prepared Statements |
| **Database** | MySQL 8.x / MariaDB 10.x, InnoDB engine, UTF8mb4 charset |
| **Authentication** | Cryptographically secure HMAC-SHA256 Bearer Token (JWT), `password_hash()` |
| **Target Hosting** | Hostinger Shared / Cloud PHP Hosting, Apache with `mod_rewrite` |

---

## 📁 Project Directory Structure

```text
bus-ticket-booking-main/
├── .htaccess                     # Root Hostinger Apache rewrite rules
├── index.php                     # Root SPA entrypoint loader
├── package.json                  # Top-level helper scripts
├── README.md                     # Project documentation
│
├── backend/                      # PHP 8+ REST API Backend
│   ├── api/
│   │   ├── auth.php              # Register, login, profile, logout
│   │   ├── buses.php             # Search, details, popular routes, admin add/del
│   │   ├── seats.php             # Booked seats & 10-min temporary holds
│   │   ├── bookings.php          # Concurrency-safe booking creation & refunds
│   │   ├── wallet.php            # Wallet balance & add money
│   │   ├── coupons.php           # Coupon verification & offers
│   │   ├── operators.php         # Operator partner registrations
│   │   ├── agents.php            # Agent partner registrations
│   │   ├── reviews.php           # Journey ratings & reviews
│   │   └── admin.php             # Analytics KPI stats & user management
│   ├── config/
│   │   └── database.php          # PDO connection, credentials & auto-init
│   ├── utils/
│   │   ├── auth.php              # JWT generation, verification, password hashing
│   │   └── response.php          # JSON response formatting & CORS headers
│   ├── index.php                 # Master backend router
│   ├── schema.sql                # Complete MySQL DDL & seed data
│   ├── .htaccess                 # Backend URL rewrites & security rules
│   └── env.example               # Template environment configuration
│
├── frontend/                     # React 18 + Vite Application
│   ├── src/
│   │   ├── components/           # ProtectedRoute, AdminRoute, Toast, etc.
│   │   ├── context/              # AuthContext (user, token, wallet sync)
│   │   ├── layouts/              # Navbar, Footer, MainLayout
│   │   ├── pages/                # Home, Search, Seats, Passenger, Payment, etc.
│   │   ├── services/             # Centralized api.js client
│   │   ├── App.jsx               # React Router route definitions
│   │   └── main.jsx              # Application bootstrap
│   ├── css/                      # Reused original styling assets
│   ├── dist/                     # Production build artifacts
│   ├── index.html                # Vite HTML root template
│   ├── package.json              # Frontend dependencies
│   └── vite.config.js            # Vite build & proxy configuration
│
└── tests/
    └── test_suite.php            # Automated backend verification test suite
```

---

## 💻 Local Windows Development Setup

### Prerequisites
- **PHP 8.0+** (Available in XAMPP at `C:\xampp\php\php.exe` or standard PHP)
- **Node.js 18+** & **npm**
- **MySQL** (XAMPP MySQL or standalone)

### Step 1: Backend Setup
1. Copy `backend/env.example` to `backend/.env`:
   ```bash
   cp backend/env.example backend/.env
   ```
2. Configure your MySQL credentials in `backend/.env`:
   ```ini
   DB_DRIVER=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=safarsathi_db
   DB_USER=root
   DB_PASSWORD=
   JWT_SECRET=your_secure_secret_key_here
   ```
3. Import `backend/schema.sql` into your MySQL database (or let `backend/config/database.php` auto-initialize it).
4. Run the PHP built-in development server on port 8000:
   ```bash
   php -S 127.0.0.1:8000 backend/index.php
   ```

### Step 2: Frontend Setup
1. Navigate to the `frontend/` directory and install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite development server:
   ```bash
   npm run dev
   ```
3. Open your browser at `http://localhost:5173`.

### Step 3: Run Automated Test Suite
Verify backend database connectivity, authentication, seat holds, concurrency, and refunds:
```bash
php tests/test_suite.php
```

---

## 🌐 Hostinger Deployment Guide

### Step 1: Database Setup on Hostinger hPanel
1. Log in to your Hostinger hPanel.
2. Go to **Databases** ➔ **MySQL Databases**.
3. Create a new database (e.g. `u123456789_safarsathi`) and database user with password.
4. Open **phpMyAdmin** for this database.
5. Click **Import**, choose `backend/schema.sql`, and execute.

### Step 2: Build the React Frontend
1. On your local machine, run:
   ```bash
   cd frontend
   npm run build
   ```
   This generates optimized production assets in `frontend/dist/`.

### Step 3: Configure Backend on Hostinger
1. In `backend/.env` (or in `backend/config/database.php`), set your Hostinger database details:
   ```ini
   APP_ENV=production
   DB_DRIVER=mysql
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=u123456789_safarsathi
   DB_USER=u123456789_user
   DB_PASSWORD=your_hostinger_db_password
   JWT_SECRET=super_secret_hostinger_key_2026
   ```

### Step 4: Upload to Hostinger `public_html/`
Upload all project files to `public_html/` via FTP (FileZilla) or Hostinger File Manager:
- Ensure `.htaccess` is present in `public_html/`.
- Ensure `backend/` and `frontend/dist/` are uploaded.
- All `/api/*` endpoints will route to `backend/index.php`, and all frontend routes (`/search`, `/my-bookings`, `/admin`) will be served seamlessly by React Router without 404s.

---

## 🔐 Default Credentials

- **Admin Account**:
  - Email: `admin@safarsathi.com`
  - Password: `amir2010khan`
  - Role: `admin` (Has access to `/admin` dashboard)

---

## 📡 REST API Reference

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new customer account | No |
| `POST` | `/api/auth/login` | Log in and receive JWT token | No |
| `GET` | `/api/auth/me` | Get authenticated user profile & wallet | Bearer Token |
| `GET` | `/api/buses` | Search buses (`?from=&to=&date=&busType=&maxPrice=`) | No |
| `GET` | `/api/buses/:id` | Get details of a specific bus | No |
| `GET` | `/api/buses/popular-routes` | Get popular highway routes | No |
| `GET` | `/api/booked-seats` | Get occupied seats for bus & date (`?busId=&date=`) | No |
| `POST` | `/api/seats/hold` | Temporary 10-minute seat hold | No |
| `POST` | `/api/bookings` | Create confirmed booking (ACID transaction) | No / Optional |
| `GET` | `/api/my-bookings` | List user bookings by token or email | Optional |
| `GET` | `/api/bookings/:pnr` | Get booking details by PNR | No |
| `POST` | `/api/cancel-booking` | Cancel ticket & auto-credit wallet refund | No |
| `GET` | `/api/wallet` | Get wallet balance & transaction history | Optional |
| `POST` | `/api/wallet` | Add funds to wallet | Optional |
| `GET` | `/api/coupons` | List active promotional offers | No |
| `POST` | `/api/coupons/apply` | Validate coupon code against fare | No |
| `POST` | `/api/operators` | Register bus fleet operator | No |
| `POST` | `/api/agents` | Register travel agent partner | No |
| `POST` | `/api/reviews` | Submit star rating and journey review | No |
| `GET` | `/api/admin/stats` | KPI analytics (Revenue, Bookings, Fleet, Users) | Admin Role |
| `GET` | `/api/admin/users` | List registered user accounts | Admin Role |
| `DELETE` | `/api/admin/users/:id` | Delete user account | Admin Role |
| `POST` | `/api/admin/add-bus` | Add new bus to fleet schedule | Admin Role |
| `DELETE` | `/api/admin/delete-bus/:id` | Delete bus from fleet | Admin Role |
#   B u s  
 
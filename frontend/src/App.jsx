import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Import CSS stylesheets for visual styling and universal responsiveness
import '../css/style.css';
import '../css/auth.css';
import '../css/search.css';
import '../css/seat.css';
import '../css/passenger.css';
import '../css/payment.css';
import '../css/my-bookings.css';
import '../css/offers.css';
import '../css/help.css';
import '../css/info-pages.css';
import '../css/responsive.css';

import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';
import { PassengerPage } from './pages/PassengerPage';
import { PaymentPage } from './pages/PaymentPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { WalletPage } from './pages/WalletPage';
import { AuthPage } from './pages/AuthPage';
import { OffersPage } from './pages/OffersPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { OperatorRegisterPage } from './pages/OperatorRegisterPage';
import { AgentRegisterPage } from './pages/AgentRegisterPage';
import { AboutPage, SupportPage } from './pages/AboutPage';
import { CareersPage, AdvertisePage, AffiliatePage, PressPage, SciencePage } from './pages/InfoPages';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

export function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Core Customer Workflow */}
        <Route path="/" element={<HomePage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/seat-selection" element={<SeatSelectionPage />} />
        <Route
          path="/passenger"
          element={
            <ProtectedRoute>
              <PassengerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-bookings"
          element={
            <ProtectedRoute>
              <MyBookingsPage />
            </ProtectedRoute>
          }
        />
        <Route path="/wallet" element={<Navigate to="/" replace />} />

        {/* Auth & Admin */}
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />

        {/* Partners & Offers */}
        <Route path="/offers" element={<OffersPage />} />
        <Route path="/register-operator" element={<OperatorRegisterPage />} />
        <Route path="/register-agent" element={<AgentRegisterPage />} />

        {/* Static & Informational Pages */}
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/careers" element={<CareersPage />} />
        <Route path="/advertise" element={<AdvertisePage />} />
        <Route path="/affiliate" element={<AffiliatePage />} />
        <Route path="/press" element={<PressPage />} />
        <Route path="/science" element={<SciencePage />} />

        {/* Catch-all Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default App;

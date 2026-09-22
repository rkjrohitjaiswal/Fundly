import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../client/src/hooks/useAuth.js';
import { HomePage } from '../client/src/pages/HomePage.js';
import { PublicLandingPage } from '../client/src/pages/PublicLandingPage.js';
import { LendingPage } from '../client/src/pages/LendingPage.js';
import { BorrowPage } from '../client/src/pages/BorrowPage.js';
import { CirclePage } from '../client/src/pages/CirclePage.js';
import { FriendDetailsPage } from '../client/src/pages/FriendDetailsPage.js';
import { LoanDetailsPage } from '../client/src/pages/LoanDetailsPage.js';
import { CreateLoanPage } from '../client/src/pages/CreateLoanPage.js';
import { CalculatorPage } from '../client/src/pages/CalculatorPage.js';
import { NotificationsPage } from '../client/src/pages/NotificationsPage.js';
import { ProfilePage } from '../client/src/pages/ProfilePage.js';
import { AuthPage } from '../client/src/pages/AuthPage.js';
import { LoadingState } from '../client/src/components/LoadingState.js';

// Root Route Gate: Shows PublicLandingPage if unauthenticated, HomePage if authenticated
const RootRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingState message="Connecting to Fundly secure network..." />
      </div>
    );
  }

  if (!user) {
    return <PublicLandingPage />;
  }

  return <HomePage />;
};

// Protected Route: Strictly guards authenticated features (Home, Lending, Borrow, Circle, etc.)
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingState message="Connecting to Fundly secure gateway..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Public Route: Redirects to Home if already authenticated
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingState message="Connecting to Fundly..." />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const HashMigrator: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (window.location.hash.startsWith('#/')) {
      const path = window.location.hash.slice(1);
      navigate(path, { replace: true });
    }
  }, [navigate]);
  return null;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <HashMigrator />
        <Routes>
          {/* Root: Live Public Marketplace & Landing if unauthenticated, Private Dashboard if authenticated */}
          <Route path="/" element={<RootRoute />} />

          {/* Public Auth Page */}
          <Route
            path="/auth"
            element={
              <PublicRoute>
                <AuthPage />
              </PublicRoute>
            }
          />

          {/* Authenticated Fintech Routes */}
          <Route
            path="/lending"
            element={
              <ProtectedRoute>
                <LendingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/borrow"
            element={
              <ProtectedRoute>
                <BorrowPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/circle"
            element={
              <ProtectedRoute>
                <CirclePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/circle/:id"
            element={
              <ProtectedRoute>
                <FriendDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/friend/:id"
            element={
              <ProtectedRoute>
                <FriendDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/loan/:id"
            element={
              <ProtectedRoute>
                <LoanDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-loan"
            element={
              <ProtectedRoute>
                <CreateLoanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/calculator"
            element={
              <ProtectedRoute>
                <CalculatorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect to Root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

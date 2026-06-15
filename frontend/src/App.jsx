import { useEffect } from 'react';
import { Navigate, Routes, Route } from 'react-router-dom';

import AuthModal from './components/AuthModal';
import Navbar from './components/Navbar';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import MyBookings from './pages/MyBookings';
import Admin from './pages/Admin';
import AdminBookings from './pages/AdminBookings';
import AdminUsers from './pages/AdminUsers';
import { useAuth } from './context/useAuth';

import { AdminRoute, ProtectedRoute } from './components/ProtectedRoutes';

function HomeRedirect() {
  const { isAdmin } = useAuth();

  return <Navigate to={isAdmin ? "/admin" : "/events"} replace />;
}

function AuthRouteRedirect({ mode }) {
  const { openLogin, openRegister } = useAuth();

  useEffect(() => {
    if (mode === "register") {
      openRegister();
    } else {
      openLogin();
    }
  }, [mode, openLogin, openRegister]);

  return <Navigate to="/events" replace />;
}

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/login" element={<AuthRouteRedirect mode="login" />} />
          <Route path="/register" element={<AuthRouteRedirect mode="register" />} />
          <Route path="/events" element={<Events />} />
          <Route path="/events/:id" element={<EventDetails />} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/bookings" element={<AdminRoute><AdminBookings /></AdminRoute>} />
        </Routes>
      </main>

      <AuthModal />
    </div>
  )
}

export default App

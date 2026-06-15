import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ConfiguratorPage from './pages/ConfiguratorPage';
import QuotesPage from './pages/QuotesPage';
import OrdersPage from './pages/OrdersPage';
import ClientsPage from './pages/ClientsPage';
import PricingAdminPage from './pages/PricingAdminPage';
import IntegrationsPage from './pages/IntegrationsPage';
import UsersPage from './pages/UsersPage';
import QaAutomationPage from './pages/QaAutomationPage';

function AuthGate() {
  const { user } = useAuth();
  return user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected — all wrapped in the shared Layout */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={
          <PrivateRoute page="dashboard"><DashboardPage /></PrivateRoute>
        } />
        <Route path="/configurator" element={
          <PrivateRoute page="configurator"><ConfiguratorPage /></PrivateRoute>
        } />
        <Route path="/quotes" element={
          <PrivateRoute page="quotes"><QuotesPage /></PrivateRoute>
        } />
        <Route path="/orders" element={
          <PrivateRoute page="orders"><OrdersPage /></PrivateRoute>
        } />
        <Route path="/clients" element={
          <PrivateRoute page="clients"><ClientsPage /></PrivateRoute>
        } />
        <Route path="/pricing-admin" element={
          <PrivateRoute page="pricing-admin"><PricingAdminPage /></PrivateRoute>
        } />
        <Route path="/integrations" element={
          <PrivateRoute page="integrations"><IntegrationsPage /></PrivateRoute>
        } />
        <Route path="/users" element={
          <PrivateRoute page="users"><UsersPage /></PrivateRoute>
        } />
        <Route path="/qa-automation" element={
          <PrivateRoute page="qa-automation"><QaAutomationPage /></PrivateRoute>
        } />
      </Route>

      {/* Root → dashboard if logged in, login if not */}
      <Route path="/" element={<AuthGate />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

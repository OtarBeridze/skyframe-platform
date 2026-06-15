import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import PrivateRoute from './components/PrivateRoute';
import { ErrorBoundary } from './components/ErrorBoundary';
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
          <PrivateRoute page="dashboard"><ErrorBoundary label="dashboard"><DashboardPage /></ErrorBoundary></PrivateRoute>
        } />
        <Route path="/configurator" element={
          <PrivateRoute page="configurator"><ErrorBoundary label="configurator"><ConfiguratorPage /></ErrorBoundary></PrivateRoute>
        } />
        <Route path="/quotes" element={
          <PrivateRoute page="quotes"><ErrorBoundary label="quotes"><QuotesPage /></ErrorBoundary></PrivateRoute>
        } />
        <Route path="/orders" element={
          <PrivateRoute page="orders"><ErrorBoundary label="orders"><OrdersPage /></ErrorBoundary></PrivateRoute>
        } />
        <Route path="/clients" element={
          <PrivateRoute page="clients"><ErrorBoundary label="clients"><ClientsPage /></ErrorBoundary></PrivateRoute>
        } />
        <Route path="/pricing-admin" element={
          <PrivateRoute page="pricing-admin"><ErrorBoundary label="pricing-admin"><PricingAdminPage /></ErrorBoundary></PrivateRoute>
        } />
        <Route path="/integrations" element={
          <PrivateRoute page="integrations"><ErrorBoundary label="integrations"><IntegrationsPage /></ErrorBoundary></PrivateRoute>
        } />
        <Route path="/users" element={
          <PrivateRoute page="users"><ErrorBoundary label="users"><UsersPage /></ErrorBoundary></PrivateRoute>
        } />
        <Route path="/qa-automation" element={
          <PrivateRoute page="qa-automation"><ErrorBoundary label="qa-automation"><QaAutomationPage /></ErrorBoundary></PrivateRoute>
        } />
      </Route>

      {/* Root → dashboard if logged in, login if not */}
      <Route path="/" element={<AuthGate />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

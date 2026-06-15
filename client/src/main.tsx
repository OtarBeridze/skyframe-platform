import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PricingProvider } from './context/PricingContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import App from './App.tsx';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element #root not found');

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary label="root">
      <BrowserRouter>
        <AuthProvider>
          <PricingProvider>
            <App />
          </PricingProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
);

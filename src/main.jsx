import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n';
import App from './App.jsx'

// Suppress noisy third-party browser extension telemetry failures (e.g. Bugsnag ERR_NAME_NOT_RESOLVED)
if (typeof window !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('[bugsnag]')) return;
    originalWarn.apply(console, args);
  };

  const originalError = console.error;
  console.error = (...args) => {
    const msg = String(args[0] || '');
    if (msg.includes('bugsnag') || msg.includes('sessions.bugsnag.com')) return;
    originalError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason ? String(event.reason.message || event.reason) : '';
    if (reason.includes('bugsnag') || reason.includes('sessions.bugsnag.com')) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

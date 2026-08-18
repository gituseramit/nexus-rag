import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Suppress browser extension errors in development
if (import.meta.env.DEV) {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Filter out chrome extension errors
    if (
      typeof args[0] === 'string' && 
      (args[0].includes('chrome-extension://') || 
       args[0].includes('Failed to fetch dynamically imported module'))
    ) {
      return;
    }
    originalConsoleError(...args);
  };

  // Prevent unhandled promise rejections from extensions
  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('chrome-extension://') ||
      event.reason?.message?.includes('Failed to fetch dynamically imported module')
    ) {
      event.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
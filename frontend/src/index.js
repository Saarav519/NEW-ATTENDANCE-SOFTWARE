import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop errors - these are harmless browser warnings
// that occur with certain UI components (dropdowns, selects, etc.)
const suppressResizeObserverError = () => {
  const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
  const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
  
  if (resizeObserverErrDiv) {
    resizeObserverErrDiv.style.display = 'none';
  }
  if (resizeObserverErr) {
    resizeObserverErr.style.display = 'none';
  }
};

// Override ResizeObserver to prevent the error
const OriginalResizeObserver = window.ResizeObserver;
window.ResizeObserver = class ResizeObserver extends OriginalResizeObserver {
  constructor(callback) {
    super((entries, observer) => {
      // Use requestAnimationFrame to batch resize observations
      window.requestAnimationFrame(() => {
        try {
          callback(entries, observer);
        } catch (e) {
          // Silently ignore ResizeObserver errors
        }
      });
    });
  }
};

// Also suppress via window.onerror
const originalOnError = window.onerror;
window.onerror = function(message, source, lineno, colno, error) {
  if (message && typeof message === 'string' && message.includes('ResizeObserver')) {
    suppressResizeObserverError();
    return true;
  }
  return originalOnError ? originalOnError(message, source, lineno, colno, error) : false;
};

// Suppress unhandled rejections related to ResizeObserver
window.addEventListener('unhandledrejection', function(event) {
  if (event.reason && event.reason.message && event.reason.message.includes('ResizeObserver')) {
    event.preventDefault();
    suppressResizeObserverError();
  }
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

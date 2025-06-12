// src/index.js - Enhanced React Entry Point for Web3 App
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('VirtualsBase Error:', error, errorInfo);
    
    // In production, you might want to log to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error);
      console.log('Error logged to monitoring service');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1e1b4b, #581c87, #be185d)',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(16px)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
            maxWidth: '500px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              🤖 Something went wrong
            </h1>
            <p style={{ marginBottom: '1.5rem', opacity: 0.8 }}>
              We're sorry, but VirtualsBase encountered an error. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '1rem'
              }}
            >
              🔄 Refresh Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details style={{ marginTop: '1rem', textAlign: 'left' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
                  Show Error Details (Dev Mode)
                </summary>
                <pre style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {this.state.error?.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Check Web3 compatibility and show warnings
const checkBrowserCompatibility = () => {
  const warnings = [];
  
  // Check for Web3 wallet
  if (typeof window !== 'undefined') {
    if (!window.ethereum) {
      warnings.push('No Web3 wallet detected. Install MetaMask for full functionality.');
    }
    
    // Check for modern browser features
    if (!window.crypto || !window.crypto.subtle) {
      warnings.push('Your browser may not support all security features.');
    }
    
    // Check for localStorage
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
    } catch (e) {
      warnings.push('Local storage is disabled. Some features may not work.');
    }
  }
  
  return warnings;
};

// Initialize app with error handling
const initializeApp = () => {
  try {
    // Check environment variables
    const requiredEnvVars = [
      'REACT_APP_NETWORK',
      'REACT_APP_CHAIN_ID',
      'REACT_APP_RPC_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(
      varName => !process.env[varName]
    );
    
    if (missingVars.length > 0 && process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Missing environment variables:', missingVars);
      console.log('💡 Copy .env.template to .env and fill in the values');
    }
    
    // Log browser compatibility warnings
    const warnings = checkBrowserCompatibility();
    if (warnings.length > 0) {
      console.warn('⚠️ Browser Compatibility Warnings:');
      warnings.forEach(warning => console.warn(`  • ${warning}`));
    }
    
    // Log app initialization in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 VirtualsBase initializing...');
      console.log('🌐 Network:', process.env.REACT_APP_NETWORK);
      console.log('🔗 Chain ID:', process.env.REACT_APP_CHAIN_ID);
      console.log('📝 Registry Contract:', process.env.REACT_APP_REGISTRY_ADDRESS || 'Not deployed yet');
    }
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
  }
};

// Performance monitoring
const measurePerformance = () => {
  if (typeof window !== 'undefined' && window.performance) {
    // Log page load time in development
    window.addEventListener('load', () => {
      const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
      if (process.env.NODE_ENV === 'development') {
        console.log(`⚡ Page loaded in ${loadTime}ms`);
      }
      
      // Report to analytics in production
      if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_ANALYTICS_ENABLED === 'true') {
        // Example: analytics.track('page_load_time', { duration: loadTime });
      }
    });
  }
};

// Service Worker registration for production
const registerServiceWorker = () => {
  if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('✅ SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('❌ SW registration failed: ', registrationError);
        });
    });
  }
};

// Initialize everything
initializeApp();
measurePerformance();
registerServiceWorker();

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure you have <div id="root"></div> in your HTML.');
}

// Create React root
const root = ReactDOM.createRoot(rootElement);

// Render the app with error boundary
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Hot module replacement for development
if (process.env.NODE_ENV === 'development' && module.hot) {
  module.hot.accept('./App', () => {
    const NextApp = require('./App').default;
    root.render(
      <React.StrictMode>
        <ErrorBoundary>
          <NextApp />
        </ErrorBoundary>
      </React.StrictMode>
    );
  });
}

// Global error handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  // Prevent the default browser error page
  event.preventDefault();
  
  // In production, log to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(event.reason);
  }
});

// Global error handler for uncaught exceptions
window.addEventListener('error', (event) => {
  console.error('Uncaught error:', event.error);
  
  // In production, log to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(event.error);
  }
});

// Export for testing purposes
if (process.env.NODE_ENV === 'test') {
  window.__APP_ROOT__ = root;
  window.__ERROR_BOUNDARY__ = ErrorBoundary;
}

// Performance mark for monitoring
if (typeof window !== 'undefined' && window.performance) {
  window.performance.mark('app-initialized');
}

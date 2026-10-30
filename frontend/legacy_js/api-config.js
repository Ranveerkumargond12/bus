/**
 * Safar Sathi - Global API Configuration
 * Automatically detects whether the app is on Hostinger, Localhost, or fallback
 */
window.API_URL = (function() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
      // If hosted in a subfolder like /bus-ticket-booking/frontend/
      if (window.location.pathname.includes('/frontend/')) {
        const base = window.location.pathname.split('/frontend/')[0];
        return window.location.origin + base + '/api';
      }
      // Standard Hostinger public_html root deployment
      return window.location.origin + '/api';
    }
  }
  // Fallback for file:// protocol
  return 'https://bus-ticket-booking-5k6m.onrender.com/api';
})();

window.API_BASE_URL = window.API_URL;

// Configuration for API endpoints
const API_CONFIG = {
    // Automatically detect the environment
    getBaseUrl: function() {
        // If we're on the deployed site, use the deployed API
        if (window.location.hostname === 'art-gallery-v085.onrender.com') {
            return 'https://art-gallery-v085.onrender.com';
        }
        // If we're on localhost, use local API
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:3000';
        }
        // Default to deployed URL for any other domain
        return 'https://art-gallery-v085.onrender.com';
    },
    
    // Get the full API URL
    getApiUrl: function(endpoint) {
        return this.getBaseUrl() + '/api' + endpoint;
    }
};

// Make it available globally
window.API_CONFIG = API_CONFIG;

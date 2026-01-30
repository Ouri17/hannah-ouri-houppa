// URL de base de l'API (Notion / backend)
// En prod sur Vercel : même origine (frontend + api sur le même projet)
function getApiBaseUrl() {
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        return (window.API_BACKEND_URL || window.location.origin) + '/api';
    }
    return 'http://localhost:3000/api';
}

const API_BASE_URL = getApiBaseUrl();

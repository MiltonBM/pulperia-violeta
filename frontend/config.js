// frontend/src/config.js
export const API_URL = process.env.NODE_ENV === 'production' 
    ? '' // En producción, las peticiones van al mismo dominio
    : 'http://localhost:5000';
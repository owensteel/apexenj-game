import axios from 'axios';

const baseURL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:3003'
    : 'https://api.apexenj.com/';

const api = axios.create({
    baseURL,
});

export default api;
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refresh = localStorage.getItem('refresh_token');
      if (refresh) {
        try {
          const { data } = await axios.post(`${BASE_URL}/token/refresh/`, { refresh });
          localStorage.setItem('access_token', data.access);
          original.headers.Authorization = `Bearer ${data.access}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── AUTH ──
export const login = (username, password) =>
  axios.post(`${BASE_URL}/token/`, { username, password });

// ── DASHBOARD ──
export const getDashboard = () => api.get('/dashboard/');
export const getInadimplenciaResumo = () => api.get('/inadimplencia/resumo/');

// ── CONDOMINIOS ──
export const getCondominios = (params) => api.get('/condominios/', { params });
export const getCondominio = (id) => api.get(`/condominios/${id}/`);
export const createCondominio = (data) => api.post('/condominios/', data);
export const updateCondominio = (id, data) => api.put(`/condominios/${id}/`, data);
export const deleteCondominio = (id) => api.delete(`/condominios/${id}/`);

// ── UNIDADES ──
export const getUnidades = (params) => api.get('/unidades/', { params });
export const getUnidade = (id) => api.get(`/unidades/${id}/`);
export const getUnidadeResumo = (id) => api.get(`/unidades/${id}/resumo-financeiro/`);
export const createUnidade = (data) => api.post('/unidades/', data);
export const updateUnidade = (id, data) => api.put(`/unidades/${id}/`, data);
export const deleteUnidade = (id) => api.delete(`/unidades/${id}/`);

// ── COBRANÇAS ──
export const getCobrancas = (params) => api.get('/cobrancas/', { params });
export const getCobranca = (id) => api.get(`/cobrancas/${id}/`);
export const createCobranca = (data) => api.post('/cobrancas/', data);
export const updateCobranca = (id, data) => api.put(`/cobrancas/${id}/`, data);
export const deleteCobranca = (id) => api.delete(`/cobrancas/${id}/`);

// ── ACORDOS ──
export const getAcordos = (params) => api.get('/acordos/', { params });
export const getAcordo = (id) => api.get(`/acordos/${id}/`);
export const createAcordo = (data) => api.post('/acordos/', data);
export const deleteAcordo = (id) => api.delete(`/acordos/${id}/`);

// ── PARCELAS ──
export const getParcelas = (params) => api.get('/parcelas-acordo/', { params });
export const getParcela = (id) => api.get(`/parcelas-acordo/${id}/`);
export const updateParcela = (id, data) => api.put(`/parcelas-acordo/${id}/`, data);

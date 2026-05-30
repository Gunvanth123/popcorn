import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('popcorn_token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export const authApi = {
  register: (data) => api.post('/auth/register', data).then(r => r.data),
  login: (data) => api.post('/auth/login', data).then(r => r.data),
  getMe: () => api.get('/auth/me').then(r => r.data),
}

export const popcornApi = {
  getAll: () => api.get('/popcorn/').then(r => r.data),
  create: (data) => api.post('/popcorn/', data).then(r => r.data),
  update: (id, data) => api.put(`/popcorn/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/popcorn/${id}`).then(r => r.data),
  extractPoster: (url) => api.get('/popcorn/extract-poster', { params: { url } }).then(r => r.data),
}

export const tmdbApi = {
  search: (query) => api.get('/tmdb/search', { params: { query } }).then(r => r.data),
  getTrending: () => api.get('/tmdb/trending').then(r => r.data),
  getRecommendations: () => api.get('/tmdb/recommendations').then(r => r.data),
  discover: (params) => api.get('/tmdb/discover', { params }).then(r => r.data),
  getSimilar: (title, category) => api.get('/tmdb/similar', { params: { title, category } }).then(r => r.data),
  getPersonalized: () => api.get('/tmdb/personalized-recommendations').then(r => r.data),
}

export const gamesApi = {
  getAll: () => api.get('/games/').then(r => r.data),
  create: (data) => api.post('/games/', data).then(r => r.data),
  update: (id, data) => api.put(`/games/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/games/${id}`).then(r => r.data),
}

export const rawgApi = {
  search: (query) => api.get('/rawg/search', { params: { query } }).then(r => r.data),
  getRecommendations: () => api.get('/rawg/recommendations').then(r => r.data),
  getSimilar: (title) => api.get('/rawg/similar', { params: { title } }).then(r => r.data),
  getPersonalized: () => api.get('/rawg/personalized-recommendations').then(r => r.data),
  getTrending: () => api.get('/rawg/trending').then(r => r.data),
  getDetails: (params) => api.get('/rawg/details', { params }).then(r => r.data),
}

export default api



import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// const API_URL = 'https://mvp-perfume-ecommerce-app.onrender.com/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
  setResetCode: (data) => api.put('/auth/set-reset-code', data),
  forgotPassword: (data) => api.post('/auth/forgotpassword', data),
  verifyResetCode: (data) => api.post('/auth/verify-reset-code', data),
  resetPassword: (token, data) => api.put(`/auth/resetpassword/${token}`, data),
  deleteAccount: () => api.delete('/auth/account'),
};

// Products API
export const productsAPI = {
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  createProduct: (data) => api.post('/products', data),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
  subscribeStockNotification: (id) => api.post(`/products/${id}/notify-stock`),
  unsubscribeStockNotification: (id) => api.delete(`/products/${id}/notify-stock`),
  checkStockSubscription: (id) => api.get(`/products/${id}/notify-stock`),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart', data),
  updateCartItem: (itemId, data) => api.put(`/cart/${itemId}`, data),
  removeFromCart: (itemId) => api.delete(`/cart/${itemId}`),
  clearCart: () => api.delete('/cart'),
};

// Orders API
export const ordersAPI = {
  createOrder: (data) => api.post('/orders', data),
  getOrders: () => api.get('/orders'),
  getOrder: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.put(`/orders/${id}/cancel`),
  updateOrderStatus: (id, data) => api.put(`/orders/${id}/status`, data),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

// Reviews API
export const reviewsAPI = {
  createReview: (data) => api.post('/reviews', data),
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  getUserReview: (orderId, productId) => api.get(`/reviews/order/${orderId}/product/${productId}`),
  updateReview: (id, data) => api.put(`/reviews/${id}`, data),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
};

// Quiz API
export const quizAPI = {
  getQuestions: () => api.get('/quiz/questions'),
  submitQuiz: (data) => api.post('/quiz/submit', data),
  getProfile: () => api.get('/quiz/profile'),
  updateProfile: (data) => api.put('/quiz/profile', data),
};

export default api;

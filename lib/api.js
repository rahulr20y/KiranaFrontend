import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Intercept requests to add token
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage if available
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            if (token) {
                config.headers.Authorization = `Token ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Intercept responses for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Clear token on 401 (Unauthorized)
            if (typeof window !== 'undefined') {
                localStorage.removeItem('authToken');
                localStorage.removeItem('userType');
                localStorage.removeItem('userId');
            }
        }
        return Promise.reject(error);
    }
);

// Auth APIs
export const authAPI = {
    register: (userData) => api.post('/users/register/', userData),
    login: (username, password) =>
        api.post('/users/login/', { username, password }),
    logout: () => api.post('/users/logout/'),
    getProfile: () => api.get('/users/profile/'),
    updateProfile: (userData) => api.patch('/users/update_profile/', userData),
    changePassword: (passwordData) =>
        api.post('/users/change_password/', passwordData),
};

// Products APIs
export const productsAPI = {
    listProducts: (params = {}) => api.get('/products/', { params }),
    getProduct: (id) => api.get(`/products/${id}/`),
    createProduct: (data) => api.post('/products/', data),
    updateProduct: (id, data) => api.patch(`/products/${id}/`, data),
    deleteProduct: (id) => api.delete(`/products/${id}/`),
    myProducts: () => api.get('/products/my_products/'),
    searchProducts: (query) =>
        api.get('/products/', { params: { search: query } }),
    getProductsByCategory: (category) =>
        api.get(`/products/by_category/?category=${category}`),
    getProductsByDealer: (dealerId) =>
        api.get(`/products/by_dealer/?dealer=${dealerId}`),
    addReview: (productId, reviewData) =>
        api.post(`/products/${productId}/add_review/`, reviewData),
    getReviews: (productId) =>
        api.get(`/products/${productId}/reviews/`),
};

// Categories APIs
export const categoriesAPI = {
    listCategories: () => api.get('/categories/'),
    getCategory: (slug) => api.get(`/categories/${slug}/`),
};

// Dealers APIs
export const dealersAPI = {
    listDealers: (params = {}) => api.get('/dealers/', { params }),
    getDealer: (id) => api.get(`/dealers/${id}/`),
    updateDealer: (id, data) => api.patch(`/dealers/${id}/`, data),
    myProfile: () => api.get('/dealers/my_profile/'),
    updateProfile: (data) => api.patch('/dealers/update_profile/', data),
    uploadDocument: (dealerId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/dealers/${dealerId}/upload_document/`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
};

// Shopkeepers APIs
export const shopkeepersAPI = {
    listShopkeepers: (params = {}) =>
        api.get('/shopkeepers/', { params }),
    getShopkeeper: (id) => api.get(`/shopkeepers/${id}/`),
    updateShopkeeper: (id, data) =>
        api.patch(`/shopkeepers/${id}/`, data),
    myProfile: () => api.get('/shopkeepers/my_profile/'),
    updateProfile: (data) => api.patch('/shopkeepers/update_profile/', data),
    followDealer: (dealerId) =>
        api.post(`/shopkeepers/follow_dealer/?dealer_id=${dealerId}`),
    unfollowDealer: (dealerId) =>
        api.post(`/shopkeepers/unfollow_dealer/?dealer_id=${dealerId}`),
    getPreferredDealers: () =>
        api.get('/shopkeepers/my_followed_dealers/'),
};

// Orders APIs
export const ordersAPI = {
    listOrders: (params = {}) => api.get('/orders/', { params }),
    getOrder: (id) => api.get(`/orders/${id}/`),
    createOrder: (orderData) => api.post('/orders/', orderData),
    updateOrder: (id, data) => api.patch(`/orders/${id}/`, data),
    myOrders: () => api.get('/orders/my_orders/'),
    cancelOrder: (id) => api.post(`/orders/${id}/cancel/`),
    updateOrderStatus: (id, statusData) =>
        api.post(`/orders/${id}/update_status/`, statusData),
    getOrderStats: () => api.get('/orders/stats/'),
};

export default api;

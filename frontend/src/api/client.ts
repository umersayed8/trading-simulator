import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Inject auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { email: string; password: string; username: string; age: number }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  completeOnboarding: () => api.post('/auth/complete-onboarding'),
};

// Trading API
export const tradingApi = {
  searchStocks:    (q: string)                    => api.get('/trading/stocks/search', { params: { q } }),
  getQuote:        (symbol: string)               => api.get(`/trading/stocks/${symbol}/quote`),
  getHistory:      (symbol: string, period?: string) =>
                     api.get(`/trading/stocks/${symbol}/history`, { params: { period } }),
  getNews:         (symbol: string)               => api.get(`/trading/stocks/${symbol}/news`),
  placeOrder:      (data: { symbol: string; type: 'BUY' | 'SELL'; quantity: number }) =>
                     api.post('/trading/orders', data),
  getOrders:       (limit?: number, offset?: number) =>
                     api.get('/trading/orders', { params: { limit, offset } }),
  getTodayTradeCount: ()                          => api.get('/trading/orders/today-count'),
  // New endpoints powered by indianapi.in
  getRecommended:  () => api.get('/trading/stocks/recommended'),
  getInsights:     () => api.get('/trading/insights'),
};

// Portfolio API
export const portfolioApi = {
  getSummary:            () => api.get('/portfolio'),
  getHoldings:           () => api.get('/portfolio/holdings'),
  getWatchlist:          () => api.get('/portfolio/watchlist'),
  addToWatchlist:    (symbol: string) => api.post('/portfolio/watchlist', { symbol }),
  removeFromWatchlist: (symbol: string) => api.delete(`/portfolio/watchlist/${symbol}`),
};

// Gamification API
export const gamificationApi = {
  getProfile:      () => api.get('/gamification/profile'),
  getAchievements: () => api.get('/gamification/achievements'),
  getChallenges:   () => api.get('/gamification/challenges'),
  getLeaderboard:  (period?: string, limit?: number) =>
                     api.get('/gamification/leaderboard', { params: { period, limit } }),
};

// Algo Trading API
export const algoApi = {
  getStrategies: () => api.get('/algo/strategies'),
  runBacktest: (data: {
    strategyId: string; symbol: string;
    parameters: Record<string, number>;
    startDate: string; endDate: string; initialCapital: number;
  }) => api.post('/algo/backtest', data),
  getUserStrategies: () => api.get('/algo/user-strategies'),
  saveStrategy: (data: {
    strategyId: string; symbol: string;
    parameters: Record<string, number>; enabled?: boolean;
  }) => api.post('/algo/user-strategies', data),
  toggleStrategy: (id: number) => api.put(`/algo/user-strategies/${id}/toggle`),
};

// Learning API
export const learningApi = {
  getLessons:      () => api.get('/learning/lessons'),
  getLesson:       (id: number) => api.get(`/learning/lessons/${id}`),
  completeLesson:  (id: number, quizScore: number) =>
                     api.post(`/learning/lessons/${id}/complete`, { quizScore }),
  getProgress:     () => api.get('/learning/progress'),
};

export default api;

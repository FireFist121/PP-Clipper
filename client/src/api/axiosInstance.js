import axios from 'axios';

const instance = axios.create({
  baseURL: '',
  withCredentials: true // Required for cookies
});

// Intercept requests to add the access token
instance.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('pp_clipper_access_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Intercept responses to handle 401 errors
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh the token
        const res = await axios.get('/api/auth/refresh', { withCredentials: true });
        const { accessToken } = res.data;

        // Store new token
        window.localStorage.setItem('pp_clipper_access_token', accessToken);

        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
        return instance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear everything
        window.localStorage.removeItem('pp_clipper_access_token');
        // Optional: window.location.href = '/login'; or let AuthContext handle it
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default instance;

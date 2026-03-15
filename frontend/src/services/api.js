
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
});


// Global Injection of JWT in each request header for authenticated endpoints, ensuring secure access to protected resources without manual token management in individual API calls. 
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


// Global response interceptor: if server returns 401, clear session and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      // clear session, set a flag and redirect to login page so UI can show a friendly banner
      localStorage.removeItem("token");
      localStorage.setItem("session_expired", "1");
      localStorage.setItem("session_expired_message", (error?.response?.data?.detail) || "Your session expired or you are unauthorized.");
      try { window.location.href = "/"; } catch (e) {}
    }
    return Promise.reject(error);
  }
);

export default api;

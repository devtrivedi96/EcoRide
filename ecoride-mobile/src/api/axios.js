import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, STORAGE_KEYS } from "./config";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(STORAGE_KEYS.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/login") &&
      !originalRequest.url?.includes("/auth/register")
    ) {
      originalRequest._retry = true;
      try {
        const credsRaw = await AsyncStorage.getItem(STORAGE_KEYS.credentials);
        if (credsRaw) {
          const creds = JSON.parse(credsRaw);
          if (creds?.email && creds?.password) {
            const res = await axios.post(`${API_BASE_URL}/auth/login`, {
              email: creds.email,
              password: creds.password,
            });
            const newToken = res.data?.token;
            const newUser = res.data?.user;
            if (newToken) {
              await AsyncStorage.multiSet([
                [STORAGE_KEYS.token, newToken],
                ...(newUser ? [[STORAGE_KEYS.user, JSON.stringify(newUser)]] : []),
              ]);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            }
          }
        }
      } catch {
        // Silent reauth failed
      }
    }
    return Promise.reject(error);
  }
);

export default api;

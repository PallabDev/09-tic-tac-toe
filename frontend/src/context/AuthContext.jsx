import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http, setAuthToken } from "../api/http";

const AuthContext = createContext(null);
const ACCESS_TOKEN_KEY = "ttt_access_token";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  const saveAccessToken = (token) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
    setAuthToken(token);
  };

  const clearAuth = () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    setAuthToken(null);
    setUser(null);
  };

  const refreshToken = async () => {
    const response = await http.post("/auth/refresh-token");
    saveAccessToken(response.data.data.accessToken);
  };

  const fetchCurrentUser = async () => {
    const response = await http.get("/auth/me");
    setUser(response.data.data.user);
  };

  useEffect(() => {
    const init = async () => {
      const existingToken = localStorage.getItem(ACCESS_TOKEN_KEY);
      if (existingToken) {
        setAuthToken(existingToken);
      }

      try {
        if (!existingToken) await refreshToken();
        await fetchCurrentUser();
      } catch (_error) {
        clearAuth();
      } finally {
        setInitializing(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const interceptor = http.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await refreshToken();
            return http(originalRequest);
          } catch (_refreshError) {
            clearAuth();
          }
        }
        return Promise.reject(error);
      }
    );

    return () => {
      http.interceptors.response.eject(interceptor);
    };
  }, []);

  const login = async (email, password) => {
    const response = await http.post("/auth/login", { email, password });
    saveAccessToken(response.data.data.accessToken);
    setUser(response.data.data.user);
  };

  const register = async (email, password) => {
    await http.post("/auth/register", { email, password });
    await login(email, password);
  };

  const logout = async () => {
    try {
      await http.post("/auth/logout");
    } finally {
      clearAuth();
    }
  };

  const value = useMemo(
    () => ({ user, login, register, logout, refreshToken, initializing }),
    [user, initializing]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

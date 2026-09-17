import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { STORAGE_KEYS } from '../api/config';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    restoreSession();
  }, []);

  async function persistSession(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.multiSet([
      [STORAGE_KEYS.token, nextToken],
      [STORAGE_KEYS.user, JSON.stringify(nextUser)],
    ]);
  }

  async function restoreSession() {
    try {
      const entries = await AsyncStorage.multiGet([STORAGE_KEYS.token, STORAGE_KEYS.user]);
      const storedToken = entries[0][1];
      const storedUser = entries[1][1] ? JSON.parse(entries[1][1]) : null;
      if (storedToken) {
        setToken(storedToken);
        setUser(storedUser);
        const freshUser = await userApi.me();
        setUser(freshUser);
        await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(freshUser));
      }
    } catch {
      await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
      setToken(null);
      setUser(null);
    } finally {
      setBooting(false);
    }
  }

  async function login(email, password) {
    const result = await authApi.login({ email, password });
    await persistSession(result.token, result.user);
  }

  async function register(payload) {
    const result = await authApi.register(payload);
    await persistSession(result.token, result.user);
  }

  async function refreshMe() {
    const freshUser = await userApi.me();
    setUser(freshUser);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(freshUser));
    return freshUser;
  }

  async function logout() {
    await AsyncStorage.multiRemove([STORAGE_KEYS.token, STORAGE_KEYS.user]);
    setToken(null);
    setUser(null);
  }

  const value = useMemo(() => ({
    booting,
    token,
    user,
    isAuthenticated: Boolean(token),
    login,
    register,
    refreshMe,
    logout,
  }), [booting, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

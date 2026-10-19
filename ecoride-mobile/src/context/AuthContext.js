import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/authApi';
import { userApi } from '../api/userApi';
import { MOCK_MODE, STORAGE_KEYS } from '../api/config';
import { MOCK_USER, MOCK_TOKEN } from '../mock/mockData';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    restoreSession();

    // Listen for app coming back from background to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has returned to foreground — silently sync user data if authenticated
        silentSync();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  async function persistSession(nextToken, nextUser, credentials) {
    setToken(nextToken);
    setUser(nextUser);
    const entries = [
      [STORAGE_KEYS.token, nextToken || ''],
      [STORAGE_KEYS.user, JSON.stringify(nextUser || null)],
    ];
    if (credentials?.email && credentials?.password) {
      entries.push([STORAGE_KEYS.credentials, JSON.stringify(credentials)]);
    }
    await AsyncStorage.multiSet(entries);
  }

  async function silentSync() {
    try {
      const storedToken = await AsyncStorage.getItem(STORAGE_KEYS.token);
      if (!storedToken || MOCK_MODE) return;

      const freshUser = await userApi.me();
      if (freshUser) {
        setUser(freshUser);
        await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(freshUser));
      }
    } catch (error) {
      // If 401, token expired — attempt silent re-auth
      if (error?.response?.status === 401) {
        await attemptSilentReauth();
      }
      // On network errors or Render sleeping, do nothing; session is preserved
    }
  }

  async function attemptSilentReauth() {
    try {
      const credsRaw = await AsyncStorage.getItem(STORAGE_KEYS.credentials);
      if (!credsRaw) {
        await clearSession();
        return;
      }
      const creds = JSON.parse(credsRaw);
      if (creds?.email && creds?.password) {
        const result = await authApi.login({
          email: creds.email,
          password: creds.password,
        });
        if (result?.token) {
          await persistSession(result.token, result.user, creds);
          return;
        }
      }
      await clearSession();
    } catch {
      // Re-authentication failed with saved credentials (e.g. password changed)
      await clearSession();
    }
  }

  async function clearSession() {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.token,
      STORAGE_KEYS.user,
      STORAGE_KEYS.credentials,
    ]);
    setToken(null);
    setUser(null);
  }

  async function restoreSession() {
    try {
      const entries = await AsyncStorage.multiGet([
        STORAGE_KEYS.token,
        STORAGE_KEYS.user,
        STORAGE_KEYS.credentials,
      ]);
      const storedToken = entries[0][1];
      const storedUser = entries[1][1] ? JSON.parse(entries[1][1]) : null;
      const storedCreds = entries[2][1] ? JSON.parse(entries[2][1]) : null;

      if (storedToken) {
        // Immediately restore session so user doesn't see login screen
        setToken(storedToken);
        setUser(storedUser);
        setBooting(false);

        // Verify and refresh in background (non-blocking)
        if (!MOCK_MODE) {
          userApi
            .me()
            .then(async (freshUser) => {
              if (freshUser) {
                setUser(freshUser);
                await AsyncStorage.setItem(
                  STORAGE_KEYS.user,
                  JSON.stringify(freshUser)
                );
              }
            })
            .catch(async (error) => {
              if (error?.response?.status === 401) {
                // Token has expired on server, attempt re-login using saved credentials
                await attemptSilentReauth();
              }
              // If network error, timeout, or server cold start: keep cached user & session
            });
        }
        return;
      }

      // No token found, but credentials are saved -> Auto-login once
      if (storedCreds?.email && storedCreds?.password) {
        try {
          const result = await authApi.login({
            email: storedCreds.email,
            password: storedCreds.password,
          });
          if (result?.token) {
            await persistSession(result.token, result.user, storedCreds);
            setBooting(false);
            return;
          }
        } catch {
          // Fall through to unauthenticated
        }
      }

      if (MOCK_MODE) {
        // Fallback for mock mode if nothing saved
        setToken(MOCK_TOKEN);
        setUser(MOCK_USER);
      }
    } catch (e) {
      console.warn('Failed restoring session:', e);
    } finally {
      setBooting(false);
    }
  }

  async function login(email, password) {
    const result = await authApi.login({ email, password });
    await persistSession(result.token, result.user, { email, password });
  }

  async function register(payload) {
    const result = await authApi.register(payload);
    await persistSession(result.token, result.user, {
      email: payload.email,
      password: payload.password,
    });
  }

  async function refreshMe() {
    if (MOCK_MODE) return user;
    const freshUser = await userApi.me();
    setUser(freshUser);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(freshUser));
    return freshUser;
  }

  async function updateUserProfile(updates) {
    const merged = { ...user, ...updates };
    setUser(merged);
    await AsyncStorage.setItem(STORAGE_KEYS.user, JSON.stringify(merged));
    return merged;
  }

  async function logout() {
    await clearSession();
  }

  const value = useMemo(
    () => ({
      booting,
      token,
      user,
      isAuthenticated: Boolean(token),
      login,
      register,
      refreshMe,
      updateUserProfile,
      logout,
    }),
    [booting, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}

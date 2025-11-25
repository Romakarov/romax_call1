import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '@/types';
import { apiClient } from '@/api/client';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (credentials: RegisterCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = '@securechat_auth';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const { user, token } = JSON.parse(stored);
        setState({
          user: { ...user, id: String(user.id) },
          token,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    } catch (error) {
      console.error('Failed to load stored auth:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const { email, password } = credentials;

      if (!email || !password) {
        return { success: false, error: 'Введите email и пароль' };
      }

      const { token, user } = await apiClient.login(email, password);

      const normalizedUser: User = {
        id: String(user.id),
        email: user.email,
        username: user.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOnline: true,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: normalizedUser, token }));

      setState({
        user: normalizedUser,
        token,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Ошибка входа';
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      const { email, password, username, inviteCode } = credentials;

      if (!email || !password || !username || !inviteCode) {
        return { success: false, error: 'Заполните все поля' };
      }

      if (!email.includes('@')) {
        return { success: false, error: 'Неверный формат email' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Пароль должен быть минимум 6 символов' };
      }

      if (username.length < 3) {
        return { success: false, error: 'Username должен быть минимум 3 символа' };
      }

      const { token, user } = await apiClient.register(email, username, password, inviteCode);

      const normalizedUser: User = {
        id: String(user.id),
        email: user.email,
        username: user.username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isOnline: true,
      };

      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: normalizedUser, token }));

      setState({
        user: normalizedUser,
        token,
        isLoading: false,
        isAuthenticated: true,
      });

      return { success: true };
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Ошибка регистрации';
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    await apiClient.logout();
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    setState({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  const updateUser = useCallback((userData: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...userData } : null,
    }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

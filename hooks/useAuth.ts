"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async (customToken?: string) => {
    const token = customToken || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Gửi header trực tiếp để chắc chắn nhất đối với iOS
      const response = await api.get('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (err) {
      console.error('Fetch user failed', err);
      setUser(null);
      if (!customToken) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/';
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') return;

      // 1. Ưu tiên lấy Token từ URL (iOS/Safari redirect handler)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');

      if (tokenFromUrl) {
        console.log('Token detected in URL, saving...');
        localStorage.setItem('token', tokenFromUrl);
        
        // Làm sạch URL ngay lập tức
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        await fetchUser(tokenFromUrl);
      } else {
        // 2. Nếu không có ở URL, lấy từ bộ nhớ
        await fetchUser();
      }
    };

    initAuth();
  }, [fetchUser]);

  return { user, loading, logout, refresh: fetchUser };
}

"use client";

import { useState, useEffect } from 'react';
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

  const fetchUser = async (token?: string) => {
    try {
      // Nếu có truyền token trực tiếp (vừa login xong)
      const config = token ? { headers: { Authorization: `Bearer ${token}` } } : {};
      const response = await api.get('/api/me', config);
      setUser(response.data);
    } catch {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    // Redirect to login or home if needed
    window.location.href = '/';
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === 'undefined') return;

      // 1. Kiểm tra Token từ URL (sau khi Google Redirect)
      const urlParams = new URLSearchParams(window.location.search);
      const tokenFromUrl = urlParams.get('token');

      if (tokenFromUrl) {
        localStorage.setItem('token', tokenFromUrl);
        // Xóa token khỏi URL cho sạch đẹp
        const cleanUrl = window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, cleanUrl);
        await fetchUser(tokenFromUrl);
      } else {
        // 2. Nếu không có ở URL, kiểm tra ở localStorage
        const savedToken = localStorage.getItem('token');
        if (savedToken) {
          await fetchUser();
        } else {
          setLoading(false);
        }
      }
    };

    initAuth();
  }, []);

  return { user, loading, logout, refresh: () => fetchUser() };
}

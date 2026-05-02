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

  const fetchUser = async () => {
    try {
      const response = await api.get('/api/me');
      setUser(response.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.get('/logout');
      setUser(null);
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      const data = await api.get('/api/me').then(res => res.data).catch(() => null);
      if (isMounted) {
        setUser(data);
        setLoading(false);
      }
    };
    load();
    return () => { isMounted = false; };
  }, []);

  return { user, loading, logout, refresh: fetchUser };
}

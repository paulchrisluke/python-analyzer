"use client"

import { useState, useEffect } from 'react';

interface NDAUserInfo {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  submittedAt: string;
}

export function useNDAUserInfo() {
  const [userInfo, setUserInfo] = useState<NDAUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('nda_user_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserInfo(parsed);
      }
    } catch (error) {
      console.error('Error reading NDA user info from session storage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearUserInfo = () => {
    try {
      sessionStorage.removeItem('nda_user_info');
      setUserInfo(null);
    } catch (error) {
      console.error('Error clearing NDA user info:', error);
    }
  };

  return { userInfo, isLoading, clearUserInfo };
}

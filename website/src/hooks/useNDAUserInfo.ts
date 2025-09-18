"use client"

import { useState, useEffect } from 'react';

interface NDAUserInfo {
  name: string;
  email: string;
  phone?: string;
  message?: string;
  submittedAt: string;
}

interface NDAPrefillData {
  displayName: string;
  emailHash: string;
  createdAt: string;
  expiresAt: string;
}

export function useNDAUserInfo() {
  const [userInfo, setUserInfo] = useState<NDAUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        // Try to get prefill data from server using httpOnly cookie
        // The server will read the httpOnly cookie and return the data
        const response = await fetch('/api/nda/prefill');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Use server data for display
            setUserInfo({
              name: result.data.displayName,
              email: `***@${result.data.emailHash}`, // Masked email
              submittedAt: result.data.submittedAt
            });
            setIsLoading(false);
            return;
          }
        }

        // Fallback to local storage (legacy support)
        const stored = sessionStorage.getItem('nda_prefill');
        if (stored) {
          const prefillData: NDAPrefillData = JSON.parse(stored);
          const now = new Date();
          const expiresAt = new Date(prefillData.expiresAt);
          
          if (now <= expiresAt) {
            // Data is still valid
            setUserInfo({
              name: prefillData.displayName,
              email: `***@${prefillData.emailHash}`, // Masked email
              submittedAt: prefillData.createdAt
            });
          } else {
            // Data has expired, remove it
            sessionStorage.removeItem('nda_prefill');
          }
        }
      } catch (error) {
        console.error('Error reading NDA user info:', error);
        // Clear any corrupted data
        sessionStorage.removeItem('nda_prefill');
      } finally {
        setIsLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  const clearUserInfo = async () => {
    try {
      // Clear local storage
      sessionStorage.removeItem('nda_prefill');
      
      // Clear server-side session and httpOnly cookie
      await fetch('/api/nda/prefill', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      setUserInfo(null);
    } catch (error) {
      console.error('Error clearing NDA user info:', error);
    }
  };

  return { userInfo, isLoading, clearUserInfo };
}

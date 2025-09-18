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
        // First try to get nonce from httpOnly cookie
        const cookies = document.cookie.split(';');
        const nonceCookie = cookies.find(cookie => 
          cookie.trim().startsWith('nda_prefill_nonce=')
        );
        
        if (nonceCookie) {
          const nonce = nonceCookie.split('=')[1];
          
          // Fetch non-PII data from server using nonce
          const response = await fetch(`/api/nda/prefill?nonce=${nonce}`);
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

  const clearUserInfo = () => {
    try {
      sessionStorage.removeItem('nda_prefill');
      // Clear the httpOnly cookie by setting it to expire
      document.cookie = 'nda_prefill_nonce=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      setUserInfo(null);
    } catch (error) {
      console.error('Error clearing NDA user info:', error);
    }
  };

  return { userInfo, isLoading, clearUserInfo };
}

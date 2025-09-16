"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { NDADocument } from '@/components/nda/NDADocument';
import { NDASignaturePad } from '@/components/nda/NDASignaturePad';
import { NDASigningForm } from '@/components/nda/NDASigningForm';

export default function NDASigningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State management
  const [isDocumentRead, setIsDocumentRead] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [documentHash, setDocumentHash] = useState<string>('');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ndaStatus, setNdaStatus] = useState<any>(null);

  const checkNDAStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/nda/status');
      if (response.ok) {
        const data = await response.json();
        setNdaStatus(data.data);
        
        // If already signed, redirect to success page
        if (data.data.isSigned) {
          router.push('/nda/success');
        }
      }
    } catch (error) {
      console.error('Error checking NDA status:', error);
    }
  }, [router]);

  // Check authentication and NDA status
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    // Check if user is admin (exempt from NDA)
    if (session.user?.role === 'admin') {
      router.push('/admin');
      return;
    }

    // Check current NDA status
    checkNDAStatus();
  }, [session, status, router, checkNDAStatus]);

  const handleDocumentHash = (hash: string) => {
    setDocumentHash(hash);
  };

  const handleScrollComplete = () => {
    setIsDocumentRead(true);
  };

  const handleSignatureChange = (signature: string | null) => {
    setSignatureData(signature);
  };

  const handleSign = async (signature: string, agreedToTerms: boolean, understoodBinding: boolean) => {
    setIsSigning(true);
    setError(null);

    try {
      const response = await fetch('/api/nda', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signatureData: signature,
          agreedToTerms,
          understoodBinding,
          documentHash
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to success page
        router.push('/nda/success');
      } else {
        setError(data.error || 'Failed to sign NDA');
      }
    } catch (error) {
      setError('An error occurred while signing the NDA');
      console.error('Error signing NDA:', error);
    } finally {
      setIsSigning(false);
    }
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!session) {
    return null; // Will redirect
  }

  // Admin user (should be redirected)
  if (session.user?.role === 'admin') {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Non-Disclosure Agreement
          </h1>
          <p className="text-lg text-gray-600">
            Please review and sign the NDA to access confidential business information
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isDocumentRead ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDocumentRead ? 'bg-green-100' : 'bg-gray-100'}`}>
                {isDocumentRead ? <CheckCircle className="h-5 w-5" /> : <span className="text-sm font-semibold">1</span>}
              </div>
              <span className="text-sm font-medium">Read Document</span>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-300"></div>
            
            <div className={`flex items-center space-x-2 ${signatureData ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${signatureData ? 'bg-green-100' : 'bg-gray-100'}`}>
                {signatureData ? <CheckCircle className="h-5 w-5" /> : <span className="text-sm font-semibold">2</span>}
              </div>
              <span className="text-sm font-medium">Sign Document</span>
            </div>
            
            <div className="w-8 h-0.5 bg-gray-300"></div>
            
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                <span className="text-sm font-semibold">3</span>
              </div>
              <span className="text-sm font-medium">Complete</span>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* NDA Document */}
        <NDADocument
          onScrollComplete={handleScrollComplete}
          onDocumentHash={handleDocumentHash}
        />

        {/* Signature Pad */}
        <NDASignaturePad
          onSignatureChange={handleSignatureChange}
          disabled={!isDocumentRead}
        />

        {/* Signing Form */}
        <NDASigningForm
          onSign={handleSign}
          signatureData={signatureData}
          isDocumentRead={isDocumentRead}
          disabled={isSigning}
        />

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>
            Questions about this NDA? Contact Cranberry Hearing and Balance Center
          </p>
        </div>
      </div>
    </div>
  );
}

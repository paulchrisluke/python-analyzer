"use client"

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, PenTool } from 'lucide-react';
import { NDADocument } from '@/components/nda/NDADocument';
import { NDASignaturePad } from '@/components/nda/NDASignaturePad';
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default function NDASigningPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const signingSectionRef = useRef<HTMLDivElement>(null);
  
  // State management
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [documentHash, setDocumentHash] = useState<string>('');
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ndaStatus, setNdaStatus] = useState<any>(null);
  const [consentA, setConsentA] = useState(false);
  const [consentB, setConsentB] = useState(false);

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
      window.location.href = '/api/auth/signin?callbackUrl=/nda';
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

  const handleSignatureChange = (signature: string | null) => {
    setSignatureData(signature);
  };

  const scrollToSigningSection = () => {
    if (signingSectionRef.current) {
      signingSectionRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleSign = async (signature: string, agreedToTerms: boolean, understoodBinding: boolean) => {
    // Early return if consents are not satisfied
    if (!consentA || !consentB) {
      setError('You must agree to both terms before signing the NDA.');
      return;
    }

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
        // Redirect to buyer dashboard since they now have NDA access
        router.push('/buyer');
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
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Header */}
              <div className="px-4 lg:px-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        Non-Disclosure Agreement
                      </h1>
                      <p className="text-lg text-gray-600">
                        Please review and sign the NDA to access confidential business information
                      </p>
                    </div>
                    <Button 
                      onClick={scrollToSigningSection}
                      className="flex items-center gap-2"
                      size="lg"
                    >
                      <PenTool className="h-4 w-4" />
                      Sign
                    </Button>
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="px-4 lg:px-6">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* NDA Document */}
              <div className="px-4 lg:px-6">
                <NDADocument
                  onDocumentHash={handleDocumentHash}
                />
              </div>

              {/* Signature Section */}
              <div ref={signingSectionRef} className="px-4 lg:px-6 space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Sign Document</h2>
                
                {/* Signer Information - Single Row */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
                  <span><strong>Name:</strong> {session?.user?.name || 'Potential Buyer'}</span>
                  <span><strong>Email:</strong> {session?.user?.email || 'Not provided'}</span>
                  <span><strong>Date:</strong> {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}</span>
                </div>
                
                {/* Digital Signature */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Digital Signature</h3>
                  <NDASignaturePad
                    onSignatureChange={handleSignatureChange}
                  />
                </div>
                
                {/* Simple Agreement */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="agree-terms"
                      checked={consentA}
                      onChange={(e) => setConsentA(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isSigning}
                    />
                    <label htmlFor="agree-terms" className="text-sm text-gray-700 cursor-pointer">
                      I have read and agree to the terms of this Non-Disclosure Agreement.
                    </label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="understand-binding"
                      checked={consentB}
                      onChange={(e) => setConsentB(e.target.checked)}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      disabled={isSigning}
                    />
                    <label htmlFor="understand-binding" className="text-sm text-gray-700 cursor-pointer">
                      I understand this is legally binding and will remain in effect for two (2) years.
                    </label>
                  </div>
                  
                  <Button
                    onClick={() => {
                      if (signatureData) {
                        handleSign(signatureData, consentA, consentB);
                      }
                    }}
                    disabled={!signatureData || !consentA || !consentB || isSigning}
                    className="w-full h-12 text-lg font-semibold"
                  >
                    {isSigning ? 'Signing...' : 'Sign & Accept NDA'}
                  </Button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <SiteFooter />
      </SidebarInset>
    </SidebarProvider>
  );
}

"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Download, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { NDAStatusResponse } from '@/types/nda';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function NDASuccessPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ndaStatus, setNdaStatus] = useState<NDAStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkNDAStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/nda/status');
      if (response.ok) {
        const data = await response.json();
        const ndaStatusData: NDAStatusResponse = data.data;
        setNdaStatus(ndaStatusData);
        
        // If not signed, redirect to signing page
        if (!ndaStatusData.isSigned && !ndaStatusData.isExempt) {
          router.push('/nda');
        }
      }
    } catch (error) {
      console.error('Error checking NDA status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/api/auth/signin');
      return;
    }

    // Check NDA status
    checkNDAStatus();
  }, [session, status, router, checkNDAStatus]);

  const handleDownloadNDA = () => {
    // In a real implementation, this would generate and download a PDF
    // For now, we'll just show an alert
    alert('NDA download feature will be implemented in the next phase');
  };

  const getNextStepUrl = () => {
    if (!session?.user) return '/';
    
    switch (session.user.role) {
      case 'buyer':
        return '/buyer/documents';
      case 'lawyer':
        return '/docs';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const getNextStepText = () => {
    if (!session?.user) return 'Continue';
    
    switch (session.user.role) {
      case 'buyer':
        return 'Access Due Diligence Documents';
      case 'lawyer':
        return 'Review Legal Documents';
      case 'admin':
        return 'Go to Admin Dashboard';
      default:
        return 'Continue';
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
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
              <div className="px-4 lg:px-6">
                <div className="max-w-2xl mx-auto">
                  {/* Success Card */}
                  <Card className="text-center">
                    <CardHeader>
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-green-600">
                        NDA Signed Successfully!
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <p className="text-lg text-gray-600 mb-4">
                          Thank you, <strong>{session.user.name}</strong>! Your Non-Disclosure Agreement has been successfully signed and recorded.
                        </p>
                        
                        {ndaStatus?.signature && (
                          <div className="bg-gray-50 rounded-lg p-4 text-left">
                            <h3 className="font-semibold text-gray-900 mb-2">Signature Details:</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p><strong>Signed:</strong> {new Date(ndaStatus.signature.signedAt).toLocaleString()}</p>
                              <p><strong>Version:</strong> {ndaStatus.signature.version}</p>
                              <p><strong>Signature ID:</strong> {ndaStatus.signature.id}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* What's Next */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-semibold text-blue-900 mb-2">What&apos;s Next?</h3>
                        <p className="text-blue-800 text-sm">
                          You now have access to confidential business information for the Cranberry Hearing and Balance Center acquisition. 
                          You can proceed to review due diligence documents and other sensitive materials.
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Button asChild size="lg" className="flex items-center space-x-2">
                          <Link href={getNextStepUrl()}>
                            <span>{getNextStepText()}</span>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          size="lg" 
                          onClick={handleDownloadNDA}
                          className="flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Download NDA Copy</span>
                        </Button>
                      </div>

                      {/* Important Notice */}
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Important:</strong> This NDA is legally binding and remains in effect for 2 years. 
                          Please ensure you understand and comply with all confidentiality obligations.
                        </AlertDescription>
                      </Alert>

                      {/* Footer Links */}
                      <div className="pt-4 border-t text-sm text-muted-foreground">
                        <p>
                          Need help? Contact{' '}
                          <a href="mailto:support@cranberryhearing.com" className="text-blue-600 hover:underline">
                            Cranberry Hearing and Balance Center
                          </a>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
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

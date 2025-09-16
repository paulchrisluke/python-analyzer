"use client"

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Lock, FileText, ArrowRight, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function NDARequiredPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [ndaStatus, setNdaStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkNDAStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/nda/status');
      if (response.ok) {
        const data = await response.json();
        setNdaStatus(data.data);
        
        // If already signed or exempt, redirect appropriately
        if (data.data.isSigned || data.data.isExempt) {
          if (data.data.isExempt) {
            router.push('/admin');
          } else {
            router.push('/nda/success');
          }
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

  const getRoleSpecificMessage = () => {
    if (!session?.user) return '';

    switch (session.user.role) {
      case 'buyer':
        return 'As a potential buyer, you need to sign a Non-Disclosure Agreement before accessing confidential business information, financial data, and due diligence documents.';
      case 'lawyer':
        return 'As legal counsel, you need to sign a Non-Disclosure Agreement before accessing confidential legal documents and sensitive business information.';
      case 'viewer':
        return 'You need to sign a Non-Disclosure Agreement before accessing confidential business information and documents.';
      default:
        return 'You need to sign a Non-Disclosure Agreement before accessing confidential information.';
    }
  };

  const getProtectedContent = () => {
    if (!session?.user) return [];

    const baseContent = [
      'Financial statements and revenue data',
      'Patient demographics and clinical information',
      'Staff employment contracts',
      'Equipment inventories and vendor relationships'
    ];

    if (session.user.role === 'buyer') {
      return [
        ...baseContent,
        'Due diligence documents',
        'Business valuation reports',
        'Market analysis and projections'
      ];
    }

    if (session.user.role === 'lawyer') {
      return [
        ...baseContent,
        'Legal contracts and agreements',
        'Compliance documentation',
        'Insurance and liability information'
      ];
    }

    return baseContent;
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
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            NDA Required
          </h1>
          <p className="text-lg text-gray-600">
            Access to confidential information requires a signed Non-Disclosure Agreement
          </p>
        </div>

        {/* Main Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
            </div>
            <CardTitle className="text-xl text-center">
              Confidential Information Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role-specific message */}
            <div className="text-center">
              <p className="text-gray-600 leading-relaxed">
                {getRoleSpecificMessage()}
              </p>
            </div>

            {/* Protected Content */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                Protected Content Includes:
              </h3>
              <ul className="space-y-2 text-sm text-gray-600">
                {getProtectedContent().map((item, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* NDA Information */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                About the NDA
              </h3>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Legally binding confidentiality agreement</li>
                <li>• Valid for 2 years from signing date</li>
                <li>• Protects sensitive business information</li>
                <li>• Required for due diligence access</li>
              </ul>
            </div>

            {/* Action Button */}
            <div className="text-center pt-4">
              <Button asChild size="lg" className="flex items-center space-x-2 mx-auto">
                <Link href="/nda">
                  <span>Sign NDA to Continue</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>

            {/* Important Notice */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> The NDA is a legally binding document. 
                Please read all terms carefully before signing. You will be able to 
                access confidential information only after completing the signing process.
              </AlertDescription>
            </Alert>

            {/* Footer */}
            <div className="text-center text-sm text-muted-foreground pt-4 border-t">
              <p>
                Questions about the NDA? Contact{' '}
                <a href="mailto:support@cranberryhearing.com" className="text-blue-600 hover:underline">
                  Cranberry Hearing and Balance Center
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

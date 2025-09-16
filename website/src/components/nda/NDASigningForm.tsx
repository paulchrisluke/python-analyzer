"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface NDASigningFormProps {
  onSign: (signatureData: string, agreedToTerms: boolean, understoodBinding: boolean) => Promise<void>;
  signatureData: string | null;
  isDocumentRead: boolean;
  disabled?: boolean;
  className?: string;
}

export function NDASigningForm({
  onSign,
  signatureData,
  isDocumentRead,
  disabled = false,
  className = ""
}: NDASigningFormProps) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [understoodBinding, setUnderstoodBinding] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSign = isDocumentRead && 
                  signatureData && 
                  agreedToTerms && 
                  understoodBinding && 
                  !disabled && 
                  !isSigning;

  const handleSign = async () => {
    if (!canSign || !signatureData) return;

    setIsSigning(true);
    setError(null);

    try {
      await onSign(signatureData, agreedToTerms, understoodBinding);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while signing');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">
          Complete Your NDA
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Review the document above, provide your signature, and confirm your agreement
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agreement Checkboxes */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="agreed-to-terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
              disabled={disabled || isSigning}
              className="mt-1"
            />
            <Label 
              htmlFor="agreed-to-terms" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              I have read and agree to the terms of this Non-Disclosure Agreement. 
              I understand that this agreement is legally binding and will remain in effect 
              for two (2) years from the date of signature.
            </Label>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="understood-binding"
              checked={understoodBinding}
              onCheckedChange={(checked) => setUnderstoodBinding(checked as boolean)}
              disabled={disabled || isSigning}
              className="mt-1"
            />
            <Label 
              htmlFor="understood-binding" 
              className="text-sm leading-relaxed cursor-pointer"
            >
              I understand that this is a legally binding agreement and that my electronic 
              signature has the same legal effect as a handwritten signature.
            </Label>
          </div>
        </div>

        {/* Simple Status Message */}
        {!isDocumentRead && (
          <div className="flex items-center space-x-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4" />
            <span>Please scroll through and read the entire document above before signing</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Sign Button */}
        <div className="pt-4">
          <Button
            onClick={handleSign}
            disabled={!canSign}
            className="w-full h-12 text-lg font-semibold"
            size="lg"
          >
            {isSigning ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing NDA...
              </>
            ) : (
              'Sign & Accept NDA'
            )}
          </Button>
        </div>

        {/* Legal Notice */}
        <div className="text-xs text-muted-foreground text-center space-y-1 pt-2 border-t">
          <p>
            <strong>Legal Notice:</strong> By clicking &quot;Sign & Accept NDA&quot;, you are creating 
            a legally binding agreement. Please ensure you have read and understood all terms 
            before proceeding.
          </p>
          <p>
            Your signature will be timestamped and stored securely for audit purposes.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

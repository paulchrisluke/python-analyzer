"use client"

import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, RotateCcw } from 'lucide-react';

interface NDASignaturePadProps {
  onSignatureChange: (signatureData: string | null) => void;
  disabled?: boolean;
  className?: string;
}

export function NDASignaturePad({ 
  onSignatureChange, 
  disabled = false,
  className = ""
}: NDASignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isDrawing, setIsDrawing] = useState(false);

  // Handle signature change
  const handleSignatureChange = () => {
    if (signatureRef.current) {
      const isEmpty = signatureRef.current.isEmpty();
      setIsEmpty(isEmpty);
      
      if (!isEmpty) {
        const signatureData = signatureRef.current.toDataURL('image/png');
        onSignatureChange(signatureData);
      } else {
        onSignatureChange(null);
      }
    }
  };

  // Clear signature
  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
      onSignatureChange(null);
    }
  };

  // Handle mouse/touch events
  const handleBegin = () => {
    setIsDrawing(true);
  };

  const handleEnd = () => {
    setIsDrawing(false);
    handleSignatureChange();
  };

  // Reset signature pad when disabled
  useEffect(() => {
    if (disabled && signatureRef.current) {
      signatureRef.current.clear();
      setIsEmpty(true);
      onSignatureChange(null);
    }
  }, [disabled, onSignatureChange]);

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-center">
          Digital Signature
        </CardTitle>
        <p className="text-sm text-muted-foreground text-center">
          Please sign your name in the box below using your mouse, finger, or stylus
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Signature Canvas */}
        <div className="relative">
          <div 
            className={`
              border-2 border-dashed rounded-lg p-4 bg-white
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}
              ${isDrawing ? 'border-blue-500' : isEmpty ? 'border-gray-300' : 'border-green-500'}
              transition-colors duration-200
            `}
            style={{ minHeight: '200px' }}
          >
            {!disabled && (
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  className: 'w-full h-full',
                  style: { 
                    width: '100%', 
                    height: '200px',
                    touchAction: 'none' // Prevent scrolling on touch devices
                  }
                }}
                onBegin={handleBegin}
                onEnd={handleEnd}
                backgroundColor="transparent"
                penColor="#000000"
                minWidth={2}
                maxWidth={3}
                throttle={16} // Smooth drawing
              />
            )}
            {disabled && (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <p>Signature pad disabled</p>
              </div>
            )}
          </div>
          
          {/* Signature Status */}
          <div className="mt-2 text-center">
            {isEmpty ? (
              <p className="text-sm text-muted-foreground">
                Signature required
              </p>
            ) : (
              <p className="text-sm text-green-600 font-medium">
                ✓ Signature captured
              </p>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={disabled || isEmpty}
            className="flex items-center space-x-2"
          >
            <Trash2 className="h-4 w-4" />
            <span>Clear</span>
          </Button>
        </div>

        {/* Instructions */}
        <div className="text-xs text-muted-foreground text-center space-y-1">
          <p>• Use your mouse, finger, or stylus to sign</p>
          <p>• Make sure your signature is clear and readable</p>
          <p>• You can clear and re-sign if needed</p>
        </div>
      </CardContent>
    </Card>
  );
}

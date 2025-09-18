"use client"

import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

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
        const dataURL = signatureRef.current.toDataURL('image/png');
        // Extract raw base64 data by removing the "data:image/png;base64," prefix
        const base64Data = dataURL.split(',')[1];
        onSignatureChange(base64Data);
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
    <div className={`w-full ${className}`}>
      {/* Signature Canvas */}
      <div className="relative">
        <div 
          className={`
            border-2 border-dashed rounded-lg p-4 bg-white
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-crosshair'}
            ${isDrawing ? 'border-blue-500' : isEmpty ? 'border-gray-300' : 'border-green-500'}
            transition-colors duration-200
          `}
          style={{ minHeight: '150px' }}
        >
          {!disabled && (
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'w-full h-full',
                style: { 
                  width: '100%', 
                  height: '150px',
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
        
        {/* Signature Status and Clear Button */}
        <div className="mt-2 flex items-center justify-between">
          <div>
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
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={disabled || isEmpty}
            className="flex items-center space-x-1"
          >
            <Trash2 className="h-3 w-3" />
            <span>Clear</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

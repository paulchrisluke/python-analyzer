"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, Circle, ArrowDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNDAUserInfo } from '@/hooks/useNDAUserInfo';
import '@/styles/nda-prose.css';

interface NDADocumentProps {
  onScrollComplete: () => void;
  onDocumentHash: (hash: string) => void;
  className?: string;
}

export function NDADocument({ 
  onScrollComplete, 
  onDocumentHash,
  className = ""
}: NDADocumentProps) {
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [ndaContent, setNdaContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { userInfo } = useNDAUserInfo();

  // Load NDA content
  useEffect(() => {
    const loadNDAContent = async () => {
      try {
        const response = await fetch('/api/nda/document');
        if (response.ok) {
          const data = await response.json();
          let content = data.data?.content || data.content;
          
          // If we have user info from session storage, personalize the content further
          if (userInfo && content) {
            content = content
              .replace(/Potential Buyer\(s\)/g, userInfo.name || 'Potential Buyer')
              .replace(/Name: _________________________/g, `Name: ${userInfo.name || 'Potential Buyer'}`)
              .replace(/Title: _________________________/g, 'Title: Potential Buyer');
          }
          
          setNdaContent(content);
          onDocumentHash(data.data?.hash || data.hash);
        } else {
          // Fallback to static content if API fails
          setNdaContent(`
# Non-Disclosure Agreement (NDA)

**Effective Date:** January 15, 2025  
**Version:** 1.0

## Parties

**Disclosing Party:** Cranberry Hearing and Balance Center  
**Receiving Party:** [User Name] ([User Email])

## Purpose

This Non-Disclosure Agreement ("Agreement") is entered into to protect confidential and proprietary information related to the potential acquisition of Cranberry Hearing and Balance Center, a healthcare practice specializing in audiology and balance services.

## Definition of Confidential Information

For purposes of this Agreement, "Confidential Information" includes, but is not limited to:

- Financial statements, revenue data, and profit/loss information
- Patient demographics and clinical data (in compliance with HIPAA)
- Staff employment contracts and compensation information
- Equipment inventories and vendor relationships
- Lease agreements and real estate information
- Insurance contracts and billing arrangements
- Operational procedures and business processes
- Marketing strategies and customer lists
- Any other proprietary business information

## Obligations of Receiving Party

The Receiving Party agrees to:

1. **Confidentiality:** Hold all Confidential Information in strict confidence and not disclose it to any third party without written consent.

2. **Limited Use:** Use Confidential Information solely for the purpose of evaluating the potential acquisition of the business.

3. **Protection:** Take reasonable precautions to protect Confidential Information from unauthorized disclosure.

4. **Return of Information:** Return or destroy all Confidential Information upon request or completion of evaluation.

5. **No Competition:** Not use Confidential Information to compete with the business or solicit its employees or customers.

## Exceptions

This Agreement does not apply to information that:
- Is publicly available
- Was already known to the Receiving Party
- Is independently developed
- Is required to be disclosed by law

## Term

This Agreement shall remain in effect for a period of **two (2) years** from the date of signature, regardless of whether the acquisition is completed.

## Remedies

The Disclosing Party shall be entitled to seek injunctive relief and monetary damages for any breach of this Agreement.

## Governing Law

This Agreement shall be governed by the laws of the Commonwealth of Pennsylvania.

## Electronic Signature

By signing this document electronically, you acknowledge that:
- You have read and understood the terms of this Agreement
- Your electronic signature has the same legal effect as a handwritten signature
- You agree to be bound by the terms of this Agreement

---

**IMPORTANT:** This is a legally binding agreement. Please read all terms carefully before signing.

**Contact Information:**  
Cranberry Hearing and Balance Center  
[Contact details for questions about this NDA]

---

*This document was generated on [Date] and is version 1.0 of the NDA for Cranberry Hearing and Balance Center business acquisition.*
          `);
        }
      } catch (error) {
        console.error('Error loading NDA content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNDAContent();
  }, [onDocumentHash, userInfo]);

  // Handle scroll events
  const handleScroll = () => {
    if (scrollAreaRef.current && contentRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollElement;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
        
        if (isAtBottom && !isScrolledToBottom) {
          setIsScrolledToBottom(true);
          onScrollComplete();
        }
      }
    }
  };

  // Auto-scroll to bottom when content is loaded
  useEffect(() => {
    if (!isLoading && ndaContent && scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        // Small delay to ensure content is rendered
        setTimeout(() => {
          scrollElement.scrollTop = scrollElement.scrollHeight;
        }, 100);
      }
    }
  }, [isLoading, ndaContent]);

  if (isLoading) {
    return (
      <Card className={`w-full ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading NDA document...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">
          Non-Disclosure Agreement
        </CardTitle>
        <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
          {isScrolledToBottom ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-green-600 font-medium">Document read completely</span>
            </>
          ) : (
            <>
              <Circle className="h-4 w-4 text-gray-400" />
              <span>Please scroll to read the entire document</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-96 w-full"
          onScrollCapture={handleScroll}
        >
          <div ref={contentRef} className="p-6">
            <div className="nda-prose">
              <ReactMarkdown>{ndaContent}</ReactMarkdown>
            </div>
            
            {/* Scroll indicator */}
            {!isScrolledToBottom && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center space-x-2 text-blue-600 animate-bounce">
                  <ArrowDown className="h-4 w-4" />
                  <span className="text-sm font-medium">Scroll down to continue</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

"use client"

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNDAUserInfo } from '@/hooks/useNDAUserInfo';
// Note: generateDocumentHash is not imported here as it's server-only
// The hash is provided by the /api/nda/document endpoint
import '@/styles/nda-prose.css';

// Function to escape HTML entities to prevent injection
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

interface NDADocumentProps {
  onDocumentHash: (hash: string) => void;
  className?: string;
}

export function NDADocument({ 
  onDocumentHash,
  className = ""
}: NDADocumentProps) {
  const [ndaContent, setNdaContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
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
            const escapedName = escapeHtml(userInfo.name || 'Potential Buyer');
            content = content
              .replace(/Potential Buyer\(s\)/g, escapedName)
              .replace(/Name: _________________________/g, `Name: ${escapedName}`)
              .replace(/Title: _________________________/g, 'Title: Potential Buyer');
          }
          
          setNdaContent(content);
          onDocumentHash(data.data?.hash || data.hash);
        } else {
          // Fallback to static content if API fails
          const fallbackContent = `
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
          `;
          
          setNdaContent(fallbackContent);
          
          // Note: Hash computation is handled server-side
          // For fallback content, we'll use a placeholder hash
          onDocumentHash('fallback-content-hash');
        }
      } catch (error) {
        console.error('Error loading NDA content:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNDAContent();
  }, [onDocumentHash, userInfo]);


  if (isLoading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading NDA document...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="nda-prose max-w-none">
        <ReactMarkdown>{ndaContent}</ReactMarkdown>
      </div>
    </div>
  );
}

"use client"

import React from 'react'

interface BusinessDescriptionData {
  paragraphs: Array<{
    text: string
    highlight?: string
  }>
  keyStrengths: string[]
  marketOpportunity: string
}

interface BusinessDescriptionProps {
  data: BusinessDescriptionData
}

export function BusinessDescription({ data }: BusinessDescriptionProps) {
  return (
    <div className="space-y-4">
      {/* Main paragraphs */}
      {data.paragraphs.map((paragraph, index) => (
        <p key={index} className="mb-4">
          {paragraph.highlight ? (
            <>
              <strong>{paragraph.highlight}</strong>
              {paragraph.text.replace(paragraph.highlight, '')}
            </>
          ) : (
            paragraph.text
          )}
        </p>
      ))}

      {/* Key Strengths section */}
      <div className="mb-4">
        <p className="mb-2">
          <strong>Key Strengths:</strong>
        </p>
        <ul className="list-disc pl-6 mb-4">
          {data.keyStrengths.map((strength, index) => (
            <li key={index}>{strength}</li>
          ))}
        </ul>
      </div>

      {/* Market Opportunity */}
      <p className="mb-4">
        <strong>Market Opportunity:</strong> {data.marketOpportunity}
      </p>
    </div>
  )
}

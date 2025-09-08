"use client"

import { SectionCards } from "@/components/section-cards"

interface InvestmentHighlightsProps {
  data?: {
    businessMetrics: {
      askingPrice: number;
      annualEbitda: number;
      annualRevenue: number;
      ebitdaMargin: number;
    };
  };
}

export function InvestmentHighlights({ data }: InvestmentHighlightsProps) {
  console.log("💰 InvestmentHighlights rendering");
  
  // Use the data from props or provide fallback values that match the original hardcoded values
  const investmentData = data || {
    businessMetrics: {
      askingPrice: 650000, // Original asking price
      annualEbitda: 266517, // Original EBITDA value
      annualRevenue: 2604167, // Original total revenue value
      ebitdaMargin: 0.43, // Original ROI as percentage (43%)
    }
  };
  
  return <SectionCards data={investmentData} />;
}


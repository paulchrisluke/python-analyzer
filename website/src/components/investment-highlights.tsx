"use client"

import { SectionCards } from "@/components/section-cards"

export function InvestmentHighlights() {
  // Static hardcoded data - no hooks, no fallbacks, no complexity
  const investmentData = {
    businessMetrics: {
      askingPrice: 650000,
      annualEbitda: 0,
      annualSde: 839245,
      annualRevenue: 2470115,
      ebitdaMargin: 0,
      sdeMargin: 0.34,
      monthlyRent: 4350
    }
  };
  
  return <SectionCards data={investmentData} />;
}
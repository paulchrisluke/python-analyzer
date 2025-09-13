"use client"

import { SectionCards } from "@/components/section-cards"
import { useRevenueData } from "@/hooks/use-revenue-data"

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
  
  // Fetch real revenue data from the simple revenue pipeline
  const { revenue, ebitda, loading, error } = useRevenueData();
  
  // Use data from props (now hardcoded static data) or fallback
  const baseData = data || {
    businessMetrics: {
      askingPrice: 650000,
      annualEbitda: 266517,
      annualRevenue: 2604167,
      ebitdaMargin: 0.43,
    }
  };
  
  // Get real data from simple pipelines
  const realRevenueData = revenue?.pipeline_run?.total_revenue;
  const realEbitdaData = ebitda?.summary?.total_ebit;
  
  // Use real revenue/EBITDA data if available, otherwise use hardcoded values
  const finalData = {
    businessMetrics: {
      askingPrice: baseData.businessMetrics.askingPrice, // Always use hardcoded asking price
      annualEbitda: realEbitdaData || baseData.businessMetrics.annualEbitda,
      annualRevenue: realRevenueData || baseData.businessMetrics.annualRevenue,
      ebitdaMargin: 0 // Will be calculated below
    }
  };
  
  // Compute ebitdaMargin from real or hardcoded data
  const computedEbitdaMargin = finalData.businessMetrics.annualRevenue > 0 
    ? finalData.businessMetrics.annualEbitda / finalData.businessMetrics.annualRevenue
    : baseData.businessMetrics.ebitdaMargin || 0;
  
  const investmentData = {
    businessMetrics: {
      ...finalData.businessMetrics,
      ebitdaMargin: computedEbitdaMargin
    }
  };
  
  console.log("💰 InvestmentHighlights data:", {
    realRevenue: realRevenueData,
    realEbitda: realEbitdaData,
    hardcodedData: baseData.businessMetrics,
    finalData: investmentData,
    loading,
    error
  });
  
  return <SectionCards data={investmentData} />;
}


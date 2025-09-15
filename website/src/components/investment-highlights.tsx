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
  
  // Determine which data to use - prioritize real data when available
  const hasRealData = realRevenueData !== undefined && realEbitdaData !== undefined;
  
  const finalData = {
    businessMetrics: {
      askingPrice: baseData.businessMetrics.askingPrice, // Always use hardcoded asking price
      annualEbitda: hasRealData ? realEbitdaData : baseData.businessMetrics.annualEbitda,
      annualRevenue: hasRealData ? realRevenueData : baseData.businessMetrics.annualRevenue,
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
    hasRealData,
    hardcodedData: baseData.businessMetrics,
    finalData: investmentData,
    loading,
    error
  });
  
  // Show loading state if we're still loading and don't have real data yet
  if (loading && !hasRealData) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }
  
  return <SectionCards data={investmentData} />;
}


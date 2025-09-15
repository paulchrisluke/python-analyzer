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
      annualEbitda: 839245, // SDE: $664,245 EBIT + $175,000 owner salary
      annualRevenue: 2604167,
      ebitdaMargin: 0.32, // Updated margin for SDE
    }
  };
  
  // Get real data from simple pipelines
  const realRevenueData = revenue?.pipeline_run?.total_revenue;
  const realEbitData = ebitda?.summary?.total_ebit;
  
  // Convert EBIT to SDE by adding back owner salary/benefits
  const ownerSalary = 175000; // Estimated owner salary/benefits
  const realSdeData = realEbitData ? realEbitData + ownerSalary : undefined;
  
  // Determine which data to use - prioritize real data when available
  const hasRealData = realRevenueData !== undefined && realSdeData !== undefined;
  
  const finalData = {
    businessMetrics: {
      askingPrice: baseData.businessMetrics.askingPrice, // Always use hardcoded asking price
      annualEbitda: hasRealData ? realSdeData : baseData.businessMetrics.annualEbitda,
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
      ebitdaMargin: computedEbitdaMargin,
      monthlyRent: 9700 // Total monthly rent for both locations
    }
  };
  
  console.log("💰 InvestmentHighlights data:", {
    realRevenue: realRevenueData,
    realEbit: realEbitData,
    realSde: realSdeData,
    ownerSalary,
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


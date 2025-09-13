"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FileTextIcon,
  CheckCircleIcon
} from "lucide-react";
import { BusinessDescription } from "@/components/business-description";
import { BusinessOverview } from "@/components/business-overview";
import { useRevenueData } from "@/hooks/use-revenue-data";

// Business data interfaces based on the actual ETL data structure
interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  phone: string;
  google_maps_url?: string;
  location_type: string;
  for_sale: boolean;
}

interface LeaseAnalysis {
  monthly_rent: number;
  annual_rent: number;
  monthly_cam: number;
  annual_cam: number;
  total_monthly_cost: number;
  total_annual_cost: number;
  cam_percentage: number;
}

interface PropertyDetails {
  primary_location: Location;
  secondary_location?: Location;
  lease_analysis: LeaseAnalysis;
  total_locations: number;
  property_type: string;
}

interface InsuranceProvider {
  name: string;
  years_active: number;
  contract_date: string;
  status: string;
  coverage_type: string;
}

interface InsuranceCoverage {
  total_insurers: number;
  insurers: InsuranceProvider[];
  total_years_coverage: number;
  average_years_per_insurer: number;
  coverage_stability_score: number;
}

interface BusinessOperations {
  services: string[];
  insurance_coverage: InsuranceCoverage;
  payment_methods: string[];
  equipment_value: string;
  business_hours: string;
}

interface MarketOpportunity {
  local_market: string;
  competition: string;
  growth_potential: string;
  market_advantage: string;
}

interface TransactionTerms {
  financing_available: boolean;
  seller_financing?: string;
  [key: string]: unknown; // For other potential fields
}

interface ListingDetails {
  business_name: string;
  business_type: string;
  asking_price: number;
  established: string;
  locations: number;
  state: string;
}

interface FinancialHighlights {
  asking_price: number;
  annual_revenue: number;
  annual_ebitda: number;
  sde: number;
  monthly_cash_flow: number;
  roi: number;
  payback_period: number;
  ebitda_margin: number;
}

interface BusinessData {
  listing_details: ListingDetails;
  financial_highlights: FinancialHighlights;
  property_details: PropertyDetails;
  business_operations: BusinessOperations;
  market_opportunity: MarketOpportunity;
  transaction_terms: TransactionTerms;
  business_description?: {
    paragraphs: Array<{
      text: string
      highlight?: string
    }>
    keyStrengths: string[]
    marketOpportunity: string
  };
  key_benefits?: string[];
}

interface BusinessDetailsProps {
  data: BusinessData;
}

export function BusinessDetails({ data }: BusinessDetailsProps) {
  console.log("🏢 BusinessDetails rendering");
  
  // Fetch real revenue data from the simple revenue pipeline
  const { revenue, ebitda, loading, error } = useRevenueData();
  
  // Get real data from simple pipelines
  const realRevenueData = revenue?.pipeline_run?.total_revenue;
  const realEbitdaData = ebitda?.summary?.total_ebit;
  
  // Update the data with real revenue/EBITDA if available
  const updatedData = {
    ...data,
    financial_highlights: {
      ...data.financial_highlights,
      annual_revenue: realRevenueData || data.financial_highlights?.annual_revenue || 0,
      annual_ebitda: realEbitdaData || data.financial_highlights?.annual_ebitda || 0,
      ebitda_margin: realRevenueData && realEbitdaData ? realEbitdaData / realRevenueData : data.financial_highlights?.ebitda_margin || 0,
      payback_period: realEbitdaData && data.financial_highlights?.asking_price ? data.financial_highlights.asking_price / realEbitdaData : 0,
    }
  };
  
  // Helper function to parse currency strings (strips non-numeric characters)
  const parseCurrency = (value: string | number | null | undefined): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return isFinite(value) ? value : 0;
    
    // Strip all non-numeric characters except decimal point and minus sign
    const numericString = String(value).replace(/[^0-9.-]/g, '');
    const parsed = parseFloat(numericString);
    return isFinite(parsed) ? parsed : 0;
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Business Overview */}
      <BusinessOverview data={updatedData} />


      {/* Business Description */}
      <Card>
        <CardHeader>
          <CardTitle>Business Description</CardTitle>
          <CardDescription>
            Detailed overview of the audiology practice
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          {data.business_description ? (
            <BusinessDescription data={data.business_description} />
          ) : (
            <>
              <p className="mb-4">
                {data.listing_details?.business_name || 'This business'} is a well-established, multi-location audiology practice serving the {data.market_opportunity?.local_market || 'local market'}. Founded in {data.listing_details?.established || 'N/A'}, the practice has built a strong reputation for providing comprehensive hearing healthcare services to patients of all ages.
              </p>
              <p className="mb-4">
                The business operates from {data.listing_details?.locations || 0} location{(data.listing_details?.locations || 0) > 1 ? 's' : ''}, offering a full range of audiological services including {data.business_operations?.services?.join(', ') || 'comprehensive audiological services'}. The practice has developed strong relationships with local healthcare providers and maintains a loyal patient base.
              </p>
            </>
          )}
          
          {data.key_benefits && data.key_benefits.length > 0 && (
            <>
              <p className="mb-4">
                <strong>Key Strengths:</strong>
              </p>
              <ul className="list-disc pl-6 mb-4">
                {data.key_benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </>
          )}
          
          {data.market_opportunity && (
            <p className="mb-4">
              <strong>Market Opportunity:</strong> {data.market_opportunity.growth_potential} - {data.market_opportunity.market_advantage}
            </p>
          )}
        </CardContent>
      </Card>

    </div>
    );  
}

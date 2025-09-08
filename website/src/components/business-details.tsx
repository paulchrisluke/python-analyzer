import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPinIcon, 
  Building2Icon, 
  UsersIcon, 
  CalendarIcon,
  DollarSignIcon,
  TrendingUpIcon,
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon
} from "lucide-react";
import { sanitize } from "@/lib/dompurify-wrapper";

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
  business_description?: string;
  key_benefits?: string[];
}

interface BusinessDetailsProps {
  data: BusinessData;
}

export function BusinessDetails({ data }: BusinessDetailsProps) {
  console.log("🏢 BusinessDetails rendering");
  
  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
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

  // Helper function to format percentage
  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate years in business
  const currentYear = new Date().getFullYear();
  const establishedYear = parseInt(data.listing_details?.established || '0');
  const yearsInBusiness = currentYear - establishedYear;

  return (
    <div className="space-y-6">
      {/* Business Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2Icon className="h-5 w-5" />
            Business Overview
          </CardTitle>
          <CardDescription>
            Comprehensive details about {data.listing_details?.business_name || 'this business'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>{data.property_details?.primary_location?.city || 'N/A'}, {data.property_details?.primary_location?.state || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Business Type:</span>
                <span>{data.listing_details?.business_type || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Locations:</span>
                <span>{data.listing_details?.locations || 0} locations</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Established:</span>
                <span>{data.listing_details?.established || 'N/A'} ({yearsInBusiness} years)</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Asking Price:</span>
                <span className="font-bold text-lg">{formatCurrency(data.financial_highlights?.asking_price || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Annual Revenue:</span>
                <span className="font-bold">{formatCurrency(data.financial_highlights?.annual_revenue || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">EBITDA Margin:</span>
                <span className="font-bold">{formatPercentage(data.financial_highlights?.ebitda_margin || 0)}</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Payback Period:</span>
                <span className="font-bold">{(data.financial_highlights?.payback_period || 0).toFixed(1)} years</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Financial Highlights
          </CardTitle>
          <CardDescription>
            Key financial metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-2xl font-bold">{formatCurrency(data.financial_highlights?.annual_revenue || 0)}</div>
              <div className="text-sm text-muted-foreground">Annual Revenue</div>
              <Badge variant="outline" className="mt-2">
                <TrendingUpIcon className="h-3 w-3 mr-1" />
                Strong Growth
              </Badge>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-2xl font-bold">{formatCurrency(data.financial_highlights?.annual_ebitda || 0)}</div>
              <div className="text-sm text-muted-foreground">Annual EBITDA</div>
              <Badge variant="outline" className="mt-2">
                {formatPercentage(data.financial_highlights?.ebitda_margin || 0)} Margin
              </Badge>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-2xl font-bold">{formatPercentage(data.financial_highlights?.roi || 0)}</div>
              <div className="text-sm text-muted-foreground">ROI Potential</div>
              <Badge variant="outline" className="mt-2">
                {(data.financial_highlights?.payback_period || 0).toFixed(1)} Year Payback
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

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
            // Sanitize HTML content to prevent XSS attacks - using safe wrapper
            <div 
              className="mb-4" 
              dangerouslySetInnerHTML={{ 
                __html: sanitize(data.business_description || '')
              }} 
            />
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

      {/* Due Diligence Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Due Diligence Documents
          </CardTitle>
          <CardDescription>
            Available documentation for serious buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Financial Documents</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Profit & Loss Statements (2023-2024)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Balance Sheets (2022-2024)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>General Ledger (2021-2025)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Tax Returns (2021-2023)</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Operational Documents</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Equipment Inventory & Valuations ({formatCurrency(parseCurrency(data.business_operations?.equipment_value))})</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Lease Agreements ({data.property_details?.property_type || 'N/A'})</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Insurance Policies ({data.business_operations?.insurance_coverage?.total_insurers || 0} providers)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Staff Information & Contracts</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Location Details */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Location Information</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span><strong>Primary:</strong> {data.property_details?.primary_location?.address || 'N/A'}, {data.property_details?.primary_location?.city || 'N/A'}, {data.property_details?.primary_location?.state || 'N/A'} {data.property_details?.primary_location?.zip_code || 'N/A'}</span>
              </div>
              {data.property_details?.secondary_location && (
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  <span><strong>Secondary:</strong> {data.property_details.secondary_location.address}, {data.property_details.secondary_location.city}, {data.property_details.secondary_location.state} {data.property_details.secondary_location.zip_code}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                <span><strong>Monthly Rent:</strong> {formatCurrency(data.property_details?.lease_analysis?.monthly_rent || 0)} + {formatCurrency(data.property_details?.lease_analysis?.monthly_cam || 0)} CAM</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button className="w-full md:w-auto">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Request Full Due Diligence Package
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

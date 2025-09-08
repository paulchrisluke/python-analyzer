import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPinIcon, 
  Building2Icon, 
  UsersIcon, 
  CalendarIcon,
  DollarSignIcon,
  TrendingUpIcon,
  ClockIcon,
  WrenchIcon,
  CheckCircleIcon,
  InfoIcon
} from "lucide-react";

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

interface BusinessOperations {
  services: string[];
  equipment_value: string;
  business_hours: string;
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
}

interface BusinessOverviewProps {
  data: BusinessData;
}

export function BusinessOverview({ data }: BusinessOverviewProps) {
  console.log("🏢 BusinessOverview rendering");
  
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
    // Guard against non-finite inputs
    if (!isFinite(value) || value === null || value === undefined) {
      return "0.0%";
    }
    
    // Detect if the value is a ratio (0-1 range) and convert to percentage
    const normalizedValue = value <= 1 && value >= 0 ? value * 100 : value;
    
    return `${normalizedValue.toFixed(1)}%`;
  };

  // Calculate years in business with proper guards
  const currentYear = new Date().getFullYear();
  const establishedYear = parseInt(data.listing_details?.established || '0');
  const yearsInBusiness = establishedYear > 0 && establishedYear <= currentYear 
    ? currentYear - establishedYear 
    : 0;

  return (
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
              <span>
                {data.listing_details?.established || 'N/A'}
                {yearsInBusiness > 0 && ` (${yearsInBusiness} years)`}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Asking Price:</span>
              <span className="font-bold">{formatCurrency(data.financial_highlights?.asking_price || 0)}</span>
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
            <div className="flex items-center gap-2">
              <Building2Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Monthly Rent:</span>
              <span className="font-bold">{formatCurrency(data.property_details?.lease_analysis?.monthly_rent || 0)} + {formatCurrency(data.property_details?.lease_analysis?.monthly_cam || 0)} CAM</span>
            </div>
            <div className="flex items-center gap-2">
              <WrenchIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Inventory:</span>
              <span className="font-bold">Included in asking price</span>
            </div>
          </div>
        </div>
        
        {/* Reason for Sale */}
        <div className="border-t pt-4">
          <div className="flex items-start gap-2">
            <InfoIcon className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="font-medium">Reason for Sale:</span>
              <p className="text-sm text-muted-foreground mt-1">
                Owner is retiring after {yearsInBusiness > 0 ? yearsInBusiness : 'many'} successful years in business. This well-established practice is ready for a new owner to continue serving the community with the same high-quality audiological care.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

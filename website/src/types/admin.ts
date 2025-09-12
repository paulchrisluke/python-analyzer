// Admin Dashboard TypeScript Interfaces
// These interfaces map exactly to the ETL JSON structures

export interface BusinessSaleData {
  metadata: {
    business_name: string;
    generated_at: string;
    etl_run_timestamp: string;
    data_period: string;
    months_analyzed: number;
    data_source: string;
    analysis_period: string;
  };
  sales: {
    total_transactions: number;
    total_revenue: number;
  };
  financials: {
    documents: DocumentItem[];
    metrics: {
      annual_revenue_projection: number;
      estimated_annual_ebitda: number;
      ebitda_margin: number;
      roi_percentage: number;
      payback_period_years: number;
      equipment_value: number;
      asking_price: number;
    };
  };
  equipment: {
    total_value: number;
    items: EquipmentItem[];
  };
  legal: {
    documents: DocumentItem[];
  };
  operational: {
    documents: DocumentItem[];
  };
  closing: {
    documents: DocumentItem[];
    milestones: MilestoneItem[];
  };
  valuation: {
    asking_price: number;
    market_value: number;
    discount_percentage: number;
    discount_amount: number;
  };
  locations: LocationItem[];
  highlights: string[];
  summary_cards: {
    revenue_total: SummaryCard;
    annual_ebitda: SummaryCard;
    roi: SummaryCard;
    equipment_value: SummaryCard;
  };
}

export interface DueDiligenceCoverage {
  etl_run_timestamp: string;
  sales: {
    status: string;
    completeness_score: number;
    missing_periods: string[];
    data_quality_issues: string[];
    coverage_details: Record<string, any>;
    fallback_strategies: string[];
  };
  financial: {
    status: string;
    completeness_score: number;
    missing_documents: string[];
    data_quality_issues: string[];
    coverage_details: {
      found_documents: string[];
      missing_documents: string[];
      total_expected: number;
      found_count: number;
    };
    fallback_strategies: string[];
    coverage_percentage: number;
  };
  equipment: {
    status: string;
    completeness_score: number;
    missing_documents: string[];
    data_quality_issues: string[];
    coverage_details: {
      equipment_count: number;
      total_value: number;
      categories_found: string[];
      categories_missing: string[];
      // Backward compatibility
      found_categories?: string[];
      missing_categories?: string[];
    };
    fallback_strategies: string[];
  };
  due_diligence: {
    overall_score: number;
    readiness_level: string;
    recommendation: string;
  };
}

export interface EquipmentAnalysis {
  etl_run_timestamp: string;
  equipment_summary: {
    total_value: number;
    items: EquipmentItem[];
  };
  generated_at: string;
  data_source: string;
}

export interface FinancialSummary {
  etl_run_timestamp: string;
  summary: Record<string, any>;
  generated_at: string;
  data_source: string;
}

export interface LandingPageData {
  etl_run_timestamp: string;
  listing_details: {
    business_name: string;
    business_type: string;
    asking_price: number;
    established: string;
    locations: number;
    state: string;
  };
  financial_highlights: {
    asking_price: number;
    annual_revenue: number;
    annual_ebitda: number;
    sde: number;
    monthly_cash_flow: number;
    roi: number;
    payback_period: number;
    ebitda_margin: number;
  };
  property_details: {
    primary_location: Record<string, any>;
    secondary_location: Record<string, any>;
    lease_analysis: Record<string, any>;
    total_locations: number;
    property_type: string;
  };
  business_operations: {
    services: string[];
    insurance_coverage: Record<string, any>;
    payment_methods: string[];
    equipment_value: number;
    business_hours: string;
  };
  market_opportunity: {
    local_market: string;
    competition: string;
    growth_potential: string;
    market_advantage: string;
  };
  transaction_terms: {
    financing_available: boolean;
    seller_financing: string;
    training_period: string;
    reason_for_sale: string;
    transition_support: string;
  };
  key_benefits: string[];
  metadata: {
    generated_at: string;
    data_source: string;
    version: string;
  };
}

// Supporting interfaces
export interface DocumentItem {
  name: string;
  file_path: string;
  status: boolean;
  notes: string;
  due_date: string | null;
  file_type: string;
  file_size: string;
  visibility: string[];
}

export interface EquipmentItem {
  name: string;
  category: string;
  value: number;
  status: boolean;
  description?: string;
  file_path?: string;
  notes?: string;
  due_date?: string | null;
  file_type?: string;
  file_size?: string;
  visibility?: string[];
}

export interface MilestoneItem {
  name: string;
  status: boolean;
  date: string | null;
  visibility: string[];
}

export interface LocationItem {
  name: string;
  type: string;
  estimated_revenue: number;
  performance: string;
}

export interface SummaryCard {
  value: number;
  label: string;
  description: string;
}

// Admin-specific interfaces
export interface AdminDashboardData {
  businessMetrics: BusinessSaleData;
  coverageAnalysis: DueDiligenceCoverage;
  equipmentData: EquipmentAnalysis;
  financialSummary: FinancialSummary;
  landingPageData: LandingPageData;
}

export interface CalculationStep {
  step: number;
  description: string;
  formula: string;
  input: number;
  result: number;
  source: string;
}

export interface DataSource {
  name: string;
  file_path: string;
  last_modified: string;
  size: string;
  status: 'valid' | 'missing' | 'stale';
}

export interface SimulatorInputs {
  revenue: number;
  ebitda: number;
  askingPrice: number;
  equipmentValue: number;
}

export interface SimulatorResults {
  roi: number;
  paybackPeriod: number;
  ebitdaMargin: number;
  monthlyCashFlow: number;
}

export interface DataQualityAlert {
  type: 'warning' | 'error' | 'info';
  message: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
}

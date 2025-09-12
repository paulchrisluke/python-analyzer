// Admin Dashboard Client-Side Utilities
// This file contains client-side utility functions for the admin dashboard

import { 
  BusinessSaleData, 
  DueDiligenceCoverage,
  CalculationStep,
  DataSource,
  DataQualityAlert
} from '../types/admin'

// Generate calculation steps for key metrics
export function generateCalculationSteps(businessData: BusinessSaleData): CalculationStep[] {
  const steps: CalculationStep[] = []
  
  // Revenue calculation steps
  if (businessData.sales.total_revenue > 0) {
    steps.push({
      step: 1,
      description: "Calculate Annual Revenue Projection",
      formula: "Total Revenue ÷ Analysis Period (months) × 12",
      input: businessData.sales.total_revenue,
      result: businessData.financials.metrics.annual_revenue_projection,
      source: "Sales data from ETL pipeline"
    })
  }
  
  // EBITDA calculation steps
  if (businessData.financials.metrics.estimated_annual_ebitda > 0) {
    steps.push({
      step: 2,
      description: "Calculate Annual EBITDA",
      formula: "Annual Revenue × EBITDA Margin",
      input: businessData.financials.metrics.annual_revenue_projection,
      result: businessData.financials.metrics.estimated_annual_ebitda,
      source: "Financial analysis from ETL pipeline"
    })
  }
  
  // ROI calculation steps
  if (businessData.financials.metrics.roi_percentage > 0) {
    steps.push({
      step: 3,
      description: "Calculate ROI Percentage",
      formula: "Annual EBITDA ÷ Asking Price × 100",
      input: businessData.financials.metrics.asking_price,
      result: businessData.financials.metrics.roi_percentage,
      source: "Investment metrics from ETL pipeline"
    })
  }
  
  // Payback period calculation steps
  if (businessData.financials.metrics.payback_period_years > 0) {
    steps.push({
      step: 4,
      description: "Calculate Payback Period",
      formula: "Asking Price ÷ Annual EBITDA",
      input: businessData.financials.metrics.asking_price,
      result: businessData.financials.metrics.payback_period_years,
      source: "Investment metrics from ETL pipeline"
    })
  }
  
  return steps
}

// Generate data sources for traceability
export function generateDataSources(businessData: BusinessSaleData): DataSource[] {
  const sources: DataSource[] = []
  
  // Add financial documents
  businessData.financials.documents.forEach(doc => {
    sources.push({
      name: doc.name,
      file_path: doc.file_path,
      last_modified: businessData.metadata.generated_at,
      size: doc.file_size,
      status: doc.status ? 'valid' : 'missing'
    })
  })
  
  // Add equipment data
  sources.push({
    name: "Equipment Analysis",
    file_path: "data/final/equipment_analysis.json",
    last_modified: businessData.metadata.etl_run_timestamp,
    size: "Unknown",
    status: 'valid'
  })
  
  // Add sales data
  sources.push({
    name: "Sales Data",
    file_path: "data/raw/sales_raw.json",
    last_modified: businessData.metadata.etl_run_timestamp,
    size: "Unknown",
    status: businessData.sales.total_transactions > 0 ? 'valid' : 'missing'
  })
  
  return sources
}

// Generate data quality alerts
export function generateDataQualityAlerts(
  businessData: BusinessSaleData, 
  coverageData: DueDiligenceCoverage
): DataQualityAlert[] {
  const alerts: DataQualityAlert[] = []
  
  // Check for missing sales data
  if (businessData.sales.total_transactions === 0) {
    alerts.push({
      type: 'warning',
      message: 'No sales transaction data found',
      category: 'Sales',
      severity: 'high'
    })
  }
  
  // Check financial document completeness
  const financialScore = coverageData.financial.completeness_score
  if (financialScore < 100) {
    alerts.push({
      type: 'warning',
      message: `Financial documents ${financialScore}% complete - missing: ${coverageData.financial.missing_documents.join(', ')}`,
      category: 'Financial',
      severity: financialScore < 50 ? 'high' : 'medium'
    })
  }
  
  // Check equipment completeness
  const equipmentScore = coverageData.equipment.completeness_score
  if (equipmentScore < 100) {
    const missingCategories = coverageData.equipment.coverage_details?.categories_missing || []
    alerts.push({
      type: 'warning',
      message: `Equipment data ${equipmentScore}% complete - missing categories: ${missingCategories.join(', ')}`,
      category: 'Equipment',
      severity: equipmentScore < 50 ? 'high' : 'medium'
    })
  }
  
  // Check overall due diligence readiness
  if (coverageData.due_diligence.readiness_level === 'poor') {
    alerts.push({
      type: 'error',
      message: coverageData.due_diligence.recommendation,
      category: 'Due Diligence',
      severity: 'high'
    })
  }
  
  return alerts
}

// Format currency values
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '$0'
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format percentage values
export function formatPercentage(value: number | undefined | null): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '0.0%'
  }
  return `${value.toFixed(1)}%`
}

// Format time ago
export function formatTimeAgo(timestamp: string): string {
  const now = new Date()
  const time = new Date(timestamp)
  
  // Check for invalid timestamps
  if (isNaN(time.getTime())) {
    return 'Invalid date'
  }
  
  const diffMs = now.getTime() - time.getTime()
  
  // Handle future timestamps
  if (diffMs < 0) {
    const absDiffMs = Math.abs(diffMs)
    const absDiffInHours = Math.floor(absDiffMs / (1000 * 60 * 60))
    
    if (absDiffInHours < 24) {
      return `In ${absDiffInHours} hour${absDiffInHours > 1 ? 's' : ''}`
    } else {
      const absDiffInDays = Math.floor(absDiffInHours / 24)
      return `In ${absDiffInDays} day${absDiffInDays > 1 ? 's' : ''}`
    }
  }
  
  // Handle past timestamps (existing logic)
  const diffInHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffInHours < 1) {
    return 'Just now'
  } else if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  } else {
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
  }
}

// Calculate data freshness status
export function getDataFreshnessStatus(timestamp: string): {
  status: 'fresh' | 'stale' | 'old' | 'invalid' | 'future';
  message: string;
  color: 'green' | 'yellow' | 'red' | 'gray' | 'blue';
} {
  const now = new Date()
  const time = new Date(timestamp)
  
  // Check for invalid timestamps
  if (isNaN(time.getTime())) {
    return {
      status: 'invalid',
      message: 'Invalid timestamp',
      color: 'gray'
    }
  }
  
  // Check for future timestamps
  if (time.getTime() > now.getTime()) {
    return {
      status: 'future',
      message: 'Future timestamp',
      color: 'blue'
    }
  }
  
  // Only compute diffInHours for past timestamps
  const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60))
  
  if (diffInHours < 24) {
    return {
      status: 'fresh',
      message: 'Data is current',
      color: 'green'
    }
  } else if (diffInHours < 72) {
    return {
      status: 'stale',
      message: 'Data may be outdated',
      color: 'yellow'
    }
  } else {
    return {
      status: 'old',
      message: 'Data is outdated',
      color: 'red'
    }
  }
}

// Admin Dashboard Server-Side Data Loading
// This file loads and processes ETL pipeline data for admin dashboard display
// Server-only module to prevent sensitive JSON data from being bundled to client

import 'server-only'
import { 
  AdminDashboardData, 
  BusinessSaleData, 
  DueDiligenceCoverage, 
  EquipmentAnalysis, 
  FinancialSummary, 
  LandingPageData
} from '../types/admin'

// Primary data sources for admin dashboard
const adminDataSources = {
  businessMetrics: 'data/final/business_sale_data.json',
  coverageAnalysis: 'data/final/due_diligence_coverage.json',
  equipmentAnalysis: 'data/final/equipment_analysis.json',
  financialSummary: 'data/final/financial_summary.json',
  landingPageData: 'data/final/landing_page_data.json'
}

// Load all ETL data for admin dashboard
export async function loadAdminData(): Promise<AdminDashboardData> {
  try {
    // Load all JSON files in parallel
    const [
      businessMetrics,
      coverageAnalysis,
      equipmentData,
      financialSummary,
      landingPageData
    ] = await Promise.all([
      loadJsonFile<BusinessSaleData>(adminDataSources.businessMetrics),
      loadJsonFile<DueDiligenceCoverage>(adminDataSources.coverageAnalysis),
      loadJsonFile<EquipmentAnalysis>(adminDataSources.equipmentAnalysis),
      loadJsonFile<FinancialSummary>(adminDataSources.financialSummary),
      loadJsonFile<LandingPageData>(adminDataSources.landingPageData)
    ])

    return {
      businessMetrics,
      coverageAnalysis,
      equipmentData,
      financialSummary,
      landingPageData
    }
  } catch (error) {
    console.error('Error loading admin data:', error)
    throw new Error('Failed to load admin dashboard data')
  }
}

// Load individual JSON file with error handling
async function loadJsonFile<T>(filePath: string): Promise<T> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // Construct full path from project root (go up one level from website directory)
    const projectRoot = path.join(process.cwd(), '..')
    const fullPath = path.join(projectRoot, filePath)
    const fileContent = await fs.readFile(fullPath, 'utf-8')
    return JSON.parse(fileContent) as T
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error)
    throw new Error(`Failed to load ${filePath}`)
  }
}

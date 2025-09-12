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
  businessMetrics: 'business_sale_data.json',
  coverageAnalysis: 'due_diligence_coverage.json',
  equipmentAnalysis: 'equipment_analysis.json',
  financialSummary: 'financial_summary.json',
  landingPageData: 'landing_page_data.json'
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
    
    // Try multiple possible data directory locations
    const possibleDataDirs = [
      process.env.ADMIN_DATA_DIR,
      path.join('public', 'data'),
      path.join('.data'),
      path.join('data')
    ].filter((dir): dir is string => Boolean(dir)) // Remove undefined values and type guard
    
    let fileContent: string
    let lastError: Error | null = null
    
    // Try each possible directory until we find the file
    for (const dataDir of possibleDataDirs) {
      try {
        const fullDataPath = path.join(process.cwd(), dataDir, filePath)
        fileContent = await fs.readFile(fullDataPath, 'utf-8')
        break // Success, exit the loop
      } catch (error) {
        lastError = error as Error
        continue // Try next directory
      }
    }
    
    if (!fileContent!) {
      throw lastError || new Error(`File not found in any data directory: ${filePath}`)
    }
    
    return JSON.parse(fileContent) as T
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error)
    throw new Error(`Failed to load ${filePath}`)
  }
}

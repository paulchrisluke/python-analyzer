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

// Validate file path to prevent directory traversal attacks
function validateFilePath(filePath: string): void {
  const path = require('path')
  
  // Check for directory traversal patterns
  if (filePath.includes('..') || filePath.includes('~') || path.isAbsolute(filePath)) {
    throw new Error(`Invalid file path: ${filePath}. Directory traversal not allowed.`)
  }
  
  // Check for null bytes (potential injection)
  if (filePath.includes('\0')) {
    throw new Error(`Invalid file path: ${filePath}. Null bytes not allowed.`)
  }
  
  // Ensure file has .json extension
  if (!filePath.endsWith('.json')) {
    throw new Error(`Invalid file path: ${filePath}. Only .json files are allowed.`)
  }
  
  // Check for suspicious patterns
  const suspiciousPatterns = ['/etc/', '/proc/', '/sys/', '/dev/', 'config', 'secret', 'password']
  const lowerPath = filePath.toLowerCase()
  for (const pattern of suspiciousPatterns) {
    if (lowerPath.includes(pattern)) {
      throw new Error(`Invalid file path: ${filePath}. Suspicious pattern detected.`)
    }
  }
}

// Load individual JSON file with error handling
async function loadJsonFile<T>(filePath: string): Promise<T> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    // SECURITY: Validate file path to prevent directory traversal
    validateFilePath(filePath)
    
    // Try multiple possible data directory locations
    // SECURITY: Never include public directories in fallback paths
    const possibleDataDirs = [
      process.env.ADMIN_DATA_DIR,
      path.join('.data'),
      path.join('data', 'admin'),
      path.join('data')
    ].filter((dir): dir is string => Boolean(dir)) // Remove undefined values and type guard
    
    let fileContent: string | null = null
    let lastError: Error | null = null
    
    // Try each possible directory until we find the file
    for (const dataDir of possibleDataDirs) {
      try {
        // Handle absolute vs relative paths properly
        const fullDataPath = path.isAbsolute(dataDir) 
          ? path.resolve(dataDir, filePath)
          : path.resolve(process.cwd(), dataDir, filePath)
        
        // Normalize the final path and validate it's within allowed directories
        const normalizedPath = path.normalize(fullDataPath)
        
        // SECURITY: Ensure the resolved path is within one of our allowed data directories
        const isWithinAllowedDir = possibleDataDirs.some(allowedDir => {
          const allowedPath = path.isAbsolute(allowedDir) 
            ? path.resolve(allowedDir)
            : path.resolve(process.cwd(), allowedDir)
          return normalizedPath.startsWith(allowedPath + path.sep) || normalizedPath === allowedPath
        })
        
        if (!isWithinAllowedDir) {
          throw new Error(`Path traversal detected: ${normalizedPath} is outside allowed directories`)
        }
        
        console.log(`Attempting to load data file: ${normalizedPath}`)
        
        fileContent = await fs.readFile(normalizedPath, 'utf-8')
        break // Success, exit the loop
      } catch (error) {
        lastError = error as Error
        continue // Try next directory
      }
    }
    
    if (!fileContent) {
      throw lastError || new Error(`File not found in any data directory: ${filePath}`)
    }
    
    return JSON.parse(fileContent) as T
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error)
    throw new Error(`Failed to load ${filePath}`)
  }
}

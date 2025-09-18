import { Document } from "@/types/document"
import expectedDocumentsData from "@/data/expected-documents.json"

// Type assertion for the JSON data
const expectedDocs = expectedDocumentsData as {
  phases: Record<Phase, PhaseExpectedDocuments>
}

export type UserRole = "admin" | "buyer" | "lawyer" | "viewer"
export type Phase = "p1" | "p2a" | "p2b" | "p3a" | "p3b" | "p4" | "p5" | "legal" | "legacy"

// Expected documents interfaces
export interface ExpectedDocument {
  name: string
  description: string
  required: boolean
  file_types: string[]
  frequency: string
  period?: string
  subtype?: string
  filename_pattern?: string
}

export interface PhaseExpectedDocuments {
  name: string
  description: string
  expected_documents: Record<string, ExpectedDocument[]>
}

export interface DocumentStatus {
  expected_document: ExpectedDocument
  actual_documents: Document[]
  status: 'uploaded' | 'pending'
  is_required: boolean
}

export interface PhaseCompletionStatus {
  phase: Phase
  total_required: number
  completed_required: number
  total_optional: number
  completed_optional: number
  completion_percentage: number
  missing_required: string[]
  missing_optional: string[]
}

// Function to organize documents by phase from blob data
export function organizeDocumentsByPhase(documents: Document[]): Record<Phase, Document[]> {
  const organized: Record<Phase, Document[]> = {
    p1: [],
    p2a: [],
    p2b: [],
    p3a: [],
    p3b: [],
    p4: [],
    p5: [],
    legal: [],
    legacy: []
  }

  documents.forEach(doc => {
    // Extract phase from notes or filename
    let phase: Phase = 'legacy'
    
    if (doc.notes?.includes('Phase: ')) {
      const phaseMatch = doc.notes.match(/Phase:\s*(p[1-5](?:[ab])?|legal|legacy)/)
      if (phaseMatch) {
        phase = phaseMatch[1] as Phase
      }
    } else if (doc.id.includes('p3a_')) {
      phase = 'p3a'
    } else if (doc.id.includes('p3b_')) {
      phase = 'p3b'
    } else if (doc.id.includes('legal_')) {
      phase = 'legal'
    }

    organized[phase].push(doc)
  })

  return organized
}

export function getPhaseAccess(phase: Phase, role: UserRole): boolean {
  const accessMatrix: Record<UserRole, Phase[]> = {
    admin: ["p1", "p2a", "p2b", "p3a", "p3b", "p4", "p5", "legal", "legacy"],
    buyer: ["p1", "p2a", "p2b", "p3a", "p3b", "p4", "p5"],
    lawyer: ["legal"],
    viewer: ["p1", "p2a", "p2b"],
  }
  return accessMatrix[role].includes(phase)
}

export function getPhaseLabel(phase: Phase): string {
  const labels: Record<Phase, string> = {
    "p1": "Phase 1 - Initial Interest",
    "p2a": "Phase 2a - Pre-Qualification", 
    "p2b": "Phase 2b - Post-NDA",
    "p3a": "Phase 3a - Due Diligence Start",
    "p3b": "Phase 3b - Advanced Due Diligence",
    "p4": "Phase 4 - Negotiation",
    "p5": "Phase 5 - Closing",
    "legal": "Legal Review",
    "legacy": "Legacy Documents",
  }
  return labels[phase]
}

export function getDocumentTypeLabel(doc: Document): string {
  // Extract subtype from filename or use category
  const filename = doc.id.toLowerCase()
  
  if (filename.includes('balance')) return "Balance Sheet"
  if (filename.includes('profit') || filename.includes('p&l')) return "P&L Report"
  if (filename.includes('tax')) return "Tax Returns"
  if (filename.includes('bank')) return "Bank Statements"
  if (filename.includes('cogs')) return "COGS Report"
  if (filename.includes('ledger')) return "General Ledger"
  if (filename.includes('lease')) return "Lease Agreement"
  if (filename.includes('insurance')) return "Insurance Document"
  if (filename.includes('equipment')) return "Equipment Document"
  if (filename.includes('sales')) return "Sales Data"
  
  // Fallback to category
  return doc.category.charAt(0).toUpperCase() + doc.category.slice(1)
}

export function getDocumentDisplayName(doc: Document): string {
  // Use safer filename source with fallback chain
  const filename = doc.name || doc.sanitized_name || doc.id
  
  // Detect extension via regex match and only append when present
  const extMatch = filename.match(/\.([^.\/]+)$/)
  const extension = extMatch ? extMatch[1] : ''
  const nameWithoutExt = extMatch ? filename.slice(0, extMatch.index) : filename
  
  // Remove phase prefixes with broader patterns covering pa/pb, p1-p5 and variants
  let displayName = nameWithoutExt
    .replace(/^p(?:(?:\d+[a-z]?)|[a-z]+)_[a-z_]+_--_/, '') // Remove p3b_equipment_general_--_ etc
    .replace(/^p(?:(?:\d+[a-z]?)|[a-z]+)_[a-z_]+_/, '') // Remove pa_financials_balance_sheet_ etc
    .replace(/^\d{4}(-\d{2}-\d{2}|-Q[1-4])_/, '') // Remove date prefix
    .replace(/_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}_/g, '_') // Remove date ranges
    .replace(/_\d{4}-\d{2}-\d{2}_/g, '_') // Remove single dates
    .replace(/_\d{4}_/g, '_') // Remove years
    // Note: Removed global .replace(/\d+/g, '') to avoid indiscriminate digit stripping
  
  // Split into parts and remove duplicates (case insensitive)
  const parts = displayName.split('_').filter(part => part.length > 0)
  const uniqueParts: string[] = []
  const seen = new Set<string>()
  
  for (const part of parts) {
    const lowerPart = part.toLowerCase()
    // Skip if we've seen this word before (case insensitive)
    if (!seen.has(lowerPart)) {
      // Also skip if this part is contained in a previous part or vice versa
      const isDuplicate = uniqueParts.some(existingPart => {
        const existingLower = existingPart.toLowerCase()
        return existingLower.includes(lowerPart) || lowerPart.includes(existingLower)
      })
      
      if (!isDuplicate) {
        uniqueParts.push(part)
        seen.add(lowerPart)
      }
    }
  }
  
  displayName = uniqueParts.join('_')
  
  // Only append extension if it was detected
  return extension ? `${displayName}.${extension}` : displayName
}

export function getCategoryColor(category: string): string {
  switch (category) {
    case "financials":
      return "bg-secondary text-secondary-foreground hover:bg-secondary"
    case "legal":
      return "bg-secondary text-secondary-foreground hover:bg-secondary"
    case "equipment":
      return "bg-secondary text-secondary-foreground hover:bg-secondary"
    case "operational":
      return "bg-secondary text-secondary-foreground hover:bg-secondary"
    case "marketing":
      return "bg-secondary text-secondary-foreground hover:bg-secondary"
    case "corporate":
      return "bg-secondary text-secondary-foreground hover:bg-secondary"
    default:
      return "bg-secondary text-secondary-foreground hover:bg-secondary"
  }
}

export function getFileIconType(doc: Document): "pdf" | "spreadsheet" | "default" {
  switch (doc.file_type.toLowerCase()) {
    case "pdf":
      return "pdf"
    case "csv":
    case "xlsx":
      return "spreadsheet"
    default:
      return "default"
  }
}

export function extractPeriod(doc: Document): string {
  const filename = doc.id
  
  // Try to extract date range from structured filenames
  // Pattern: 2023-11-01_Bank_Statements_2023-11-01_to_2023-11-30_Chase_BusinessChecking_CranberryHearing.pdf
  const dateRangeMatch = filename.match(/(\d{4}-\d{2}-\d{2})_to_(\d{4}-\d{2}-\d{2})/)
  if (dateRangeMatch) {
    const startDate = new Date(dateRangeMatch[1])
    const endDate = new Date(dateRangeMatch[2])
    
    // Format as "Nov 1 - Nov 30, 2023"
    const startFormatted = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endFormatted = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    
    return `${startFormatted} - ${endFormatted}`
  }
  
  // Try to extract single date and format it
  const singleDateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/)
  if (singleDateMatch) {
    const date = new Date(singleDateMatch[1])
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  
  // Fallback to year extraction
  const filenameLower = filename.toLowerCase()
  if (filenameLower.includes("2025")) return "2025"
  if (filenameLower.includes("2024")) return "2024"
  if (filenameLower.includes("2023")) return "2023"
  if (filenameLower.includes("2022")) return "2022"
  if (filenameLower.includes("2021")) return "2021"
  if (filenameLower.includes("2019")) return "2019"
  if (filenameLower.includes("q4")) return "Q4 2023"
  if (filenameLower.includes("q3")) return "Q3 2023"
  if (filenameLower.includes("q2")) return "Q2 2023"
  if (filenameLower.includes("q1")) return "Q1 2023"

  // Fallback to extracting year from created_at
  return new Date(doc.created_at).getFullYear().toString()
}

// Function to compute SHA256 hash of a file
export async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Expected documents functions
export function getExpectedDocumentsForPhase(phase: Phase): PhaseExpectedDocuments | null {
  return expectedDocs.phases[phase] || null
}

export function getExpectedDocumentsForCategory(phase: Phase, category: string): ExpectedDocument[] {
  const phaseData = getExpectedDocumentsForPhase(phase)
  if (!phaseData) return []
  
  return phaseData.expected_documents[category] || []
}

export function checkDocumentStatus(phase: Phase, category: string, actualDocuments: Document[]): DocumentStatus[] {
  const expectedDocs = getExpectedDocumentsForCategory(phase, category)
  const statuses: DocumentStatus[] = []
  
  // Check each expected document
  expectedDocs.forEach(expected => {
    const matchingDocs = actualDocuments.filter(doc => {
      // Check if document matches the expected pattern
      const expectedPattern = expected.filename_pattern || `${phase}_${category}_${expected.subtype || 'general'}_{date}_{originalname}`
      const patternRegex = expectedPattern
        .replace('{date}', '\\d{4}-\\d{2}-\\d{2}')
        .replace('{originalname}', '.*')
        .replace(/\{.*\}/g, '.*')
      
      return new RegExp(patternRegex).test(doc.sanitized_name)
    })
    
    statuses.push({
      expected_document: expected,
      actual_documents: matchingDocs,
      status: matchingDocs.length > 0 ? 'uploaded' : 'pending',
      is_required: expected.required
    })
  })
  
  return statuses
}

export function getPhaseCompletionStatus(phase: Phase, allDocuments: Document[]): PhaseCompletionStatus {
  const phaseData = getExpectedDocumentsForPhase(phase)
  if (!phaseData) {
    return {
      phase,
      total_required: 0,
      completed_required: 0,
      total_optional: 0,
      completed_optional: 0,
      completion_percentage: 100,
      missing_required: [],
      missing_optional: []
    }
  }
  
  let totalRequired = 0
  let completedRequired = 0
  let totalOptional = 0
  let completedOptional = 0
  const missingRequired: string[] = []
  const missingOptional: string[] = []
  
  Object.keys(phaseData.expected_documents).forEach(category => {
    const statuses = checkDocumentStatus(phase, category, allDocuments)
    
    statuses.forEach(status => {
      if (status.expected_document.required) {
        totalRequired++
        if (status.status === 'uploaded') {
          completedRequired++
        } else {
          missingRequired.push(status.expected_document.name)
        }
      } else {
        totalOptional++
        if (status.status === 'uploaded') {
          completedOptional++
        } else {
          missingOptional.push(status.expected_document.name)
        }
      }
    })
  })
  
  const total = totalRequired + totalOptional
  const completed = completedRequired + completedOptional
  const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 100
  
  return {
    phase,
    total_required: totalRequired,
    completed_required: completedRequired,
    total_optional: totalOptional,
    completed_optional: completedOptional,
    completion_percentage: completionPercentage,
    missing_required: missingRequired,
    missing_optional: missingOptional
  }
}

export function getAllPhaseCompletionStatuses(allDocuments: Document[]): PhaseCompletionStatus[] {
  const phases: Phase[] = ['p1', 'p2a', 'p2b', 'p3a', 'p3b', 'p4', 'p5', 'legal', 'legacy']
  return phases.map(phase => getPhaseCompletionStatus(phase, allDocuments))
}
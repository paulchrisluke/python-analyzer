"use client"

import { useState } from "react"
import { Document } from "@/types/document"
import { UserRole, Phase, organizeDocumentsByPhase, getPhaseAccess, getPhaseLabel, getDocumentTypeLabel, getFileIconType, extractPeriod } from "@/lib/document-utils"
import { FolderGrid } from "./FolderGrid"
import { BreadcrumbNavigation } from "./BreadcrumbNavigation"
import { AccessRequestModal } from "./AccessRequestModal"
import { PhaseTable } from "./PhaseTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Folder, FileText, FileSpreadsheet, Lock, Download, Eye, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export interface FolderItem {
  id: string
  name: string
  type: 'folder' | 'document'
  icon: React.ComponentType<any>
  itemCount?: number
  isLocked?: boolean
  year?: string
  documentType?: string
  document?: Document
  children?: FolderItem[]
}

interface FolderViewProps {
  documents: Document[]
  userRole: UserRole
  onAccessRequest?: (folderId: string) => void
}

export function FolderView({ documents, userRole, onAccessRequest }: FolderViewProps) {
  const [currentPath, setCurrentPath] = useState<string[]>(['Documents'])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showAccessRequest, setShowAccessRequest] = useState(false)
  const [requestedFolder, setRequestedFolder] = useState<string | null>(null)
  const [selectedFolder, setSelectedFolder] = useState<{ year: string; documentType: string } | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Organize documents by year and document type
  const organizedDocuments = organizeDocumentsByYearAndType(documents)
  
  // Get all items organized by year sections
  const allItems = getAllItemsByYear(organizedDocuments, userRole)

  const handleFolderClick = (item: FolderItem) => {
    if (item.type === 'folder') {
      if (item.isLocked) {
        setRequestedFolder(item.id)
        setShowAccessRequest(true)
        return
      }
      // For document type folders, show documents using PhaseTable
      if (item.documentType && item.year) {
        setSelectedFolder({ year: item.year, documentType: item.documentType })
      }
    }
  }


  const handleAccessRequest = (folderId: string) => {
    onAccessRequest?.(folderId)
    setShowAccessRequest(false)
    setRequestedFolder(null)
  }

  const handleBulkDownload = () => {
    // Get all documents from all year sections
    const allDocuments = allItems.flatMap(yearSection => 
      yearSection.folders
        .filter(item => item.type === 'document' && selectedItems.has(item.id))
        .map(item => item.document)
        .filter(Boolean)
    ) as Document[]
    
    // TODO: Implement bulk download
    console.log('Bulk download:', allDocuments)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h1 className="text-2xl font-bold">Document Library</h1>
          <p className="text-muted-foreground">
            {documents.length} total documents organized by year and type
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!selectedFolder && (
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          )}
          {selectedItems.size > 0 && (
            <Button onClick={handleBulkDownload} size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download ({selectedItems.size})
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {selectedFolder ? (
          // Show PhaseTable for selected folder
          <div>
            <div className="flex items-center gap-4 mb-6">
              <Button 
                variant="outline" 
                onClick={() => setSelectedFolder(null)}
                className="flex items-center gap-2"
              >
                ← Back to Documents
              </Button>
              <div>
                <h2 className="text-xl font-semibold">
                  {selectedFolder.year} - {selectedFolder.documentType}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {getDocumentsForFolder(organizedDocuments, selectedFolder).length} documents
                </p>
              </div>
            </div>
            <PhaseTable
              phase="p3a" // Use a default phase since we're not using phases anymore
              documents={getDocumentsForFolder(organizedDocuments, selectedFolder)}
              hasAccess={true} // Admin has full access
            />
          </div>
        ) : (
          // Show year sections
          allItems.map((yearSection) => (
            <div key={yearSection.year} className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">{yearSection.year}</h2>
                <span className="text-sm text-muted-foreground">
                  {yearSection.totalDocuments} documents
                </span>
              </div>
              <FolderGrid
                items={yearSection.folders}
                selectedItems={selectedItems}
                onItemClick={handleFolderClick}
                onItemSelect={(itemId, selected) => {
                  const newSelected = new Set(selectedItems)
                  if (selected) {
                    newSelected.add(itemId)
                  } else {
                    newSelected.delete(itemId)
                  }
                  setSelectedItems(newSelected)
                }}
                userRole={userRole}
                viewMode={viewMode}
              />
            </div>
          ))
        )}
      </div>

      {/* Access Request Modal */}
      <AccessRequestModal
        isOpen={showAccessRequest}
        onClose={() => setShowAccessRequest(false)}
        onRequestAccess={() => handleAccessRequest(requestedFolder!)}
        folderName={requestedFolder || ''}
      />
    </div>
  )
}

// Helper function to organize documents by year and document type
function organizeDocumentsByYearAndType(documents: Document[]) {
  const organized: Record<string, Record<string, Document[]>> = {}
  
  documents.forEach(doc => {
    const year = extractYear(doc)
    const documentType = getDocumentTypeLabel(doc)
    
    if (!organized[year]) {
      organized[year] = {}
    }
    if (!organized[year][documentType]) {
      organized[year][documentType] = []
    }
    
    organized[year][documentType].push(doc)
  })
  
  return organized
}

// Helper function to get all items organized by year sections
function getAllItemsByYear(
  organized: Record<string, Record<string, Document[]>>,
  userRole: UserRole
): Array<{ year: string; totalDocuments: number; folders: FolderItem[] }> {
  return Object.keys(organized)
    .sort((a, b) => b.localeCompare(a)) // Most recent first
    .map(year => {
      const yearData = organized[year]
      const folders = Object.keys(yearData)
        .sort()
        .map(documentType => ({
          id: `type-${year}-${documentType}`,
          name: documentType,
          type: 'folder' as const,
          icon: Folder,
          itemCount: yearData[documentType].length,
          year,
          documentType
        }))
      
      return {
        year,
        totalDocuments: getTotalDocumentsInYear(yearData),
        folders
      }
    })
}

// Helper functions
function extractYear(doc: Document): string {
  const filename = doc.id.toLowerCase()
  if (filename.includes("2025")) return "2025"
  if (filename.includes("2024")) return "2024"
  if (filename.includes("2023")) return "2023"
  if (filename.includes("2022")) return "2022"
  if (filename.includes("2021")) return "2021"
  if (filename.includes("2019")) return "2019"
  return new Date(doc.created_at).getFullYear().toString()
}


function getTotalDocumentsInYear(yearData: Record<string, Document[]>): number {
  return Object.values(yearData).flat().length
}

function getDocumentsForFolder(
  organized: Record<string, Record<string, Document[]>>,
  folder: { year: string; documentType: string }
): Document[] {
  return organized[folder.year]?.[folder.documentType] || []
}

function getDocumentDisplayName(doc: Document): string {
  const filename = doc.id
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, '')
  const extension = filename.split('.').pop()
  
  let displayName = nameWithoutExt
    .replace(/^p[ab]_[a-z_]+_--_/, '')
    .replace(/^p[ab]_[a-z_]+_/, '')
    .replace(/^\d{4}(-\d{2}-\d{2}|-Q[1-4])_/, '')
    .replace(/_\d{4}-\d{2}-\d{2}_to_\d{4}-\d{2}-\d{2}_/g, '_')
    .replace(/_\d{4}-\d{2}-\d{2}_/g, '_')
    .replace(/_\d{4}_/g, '_')
    .replace(/\d+/g, '')
  
  const parts = displayName.split('_').filter(part => part.length > 0)
  const uniqueParts: string[] = []
  const seen = new Set<string>()
  
  for (const part of parts) {
    const lowerPart = part.toLowerCase()
    if (!seen.has(lowerPart)) {
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
  return displayName + '.' + extension
}

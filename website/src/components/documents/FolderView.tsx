"use client"

import { useState } from "react"
import { Document } from "@/types/document"
import { UserRole, Phase, organizeDocumentsByPhase, getPhaseAccess, getPhaseLabel, getDocumentTypeLabel, getFileIconType, extractPeriod, getDocumentDisplayName } from "@/lib/document-utils"
import { FolderGrid } from "./FolderGrid"
import { BreadcrumbNavigation } from "./BreadcrumbNavigation"
import { AccessRequestModal } from "./AccessRequestModal"
import { PhaseTable } from "./PhaseTable"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Folder, FileText, FileSpreadsheet, Lock, Download, MoreHorizontal } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { downloadDocument } from "@/lib/document-access"

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

  const handleBulkDownload = async () => {
    let documentsToDownload: Document[] = []
    
    if (selectedFolder) {
      // If we're in a specific folder, get documents from that folder
      const folderDocuments = getDocumentsForFolder(organizedDocuments, selectedFolder)
      
      // Filter for selected documents if any, otherwise download all documents in the folder
      if (selectedItems.size > 0) {
        documentsToDownload = folderDocuments.filter(doc => selectedItems.has(doc.id))
      } else {
        documentsToDownload = folderDocuments
      }
    } else {
      // If we're at the top level, get selected documents from all year sections
      documentsToDownload = allItems.flatMap(yearSection => 
        yearSection.folders
          .filter(item => item.type === 'document' && selectedItems.has(item.id))
          .map(item => item.document)
          .filter(Boolean)
      ) as Document[]
    }
    
    // Download each document sequentially to avoid overwhelming the server
    for (const document of documentsToDownload) {
      const success = await downloadDocument(document);
      if (!success) {
        console.error('Failed to download document:', document.id);
        // TODO: Show error toast/notification
      }
      // Add a small delay between downloads
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  const handleDownload = async (item: FolderItem) => {
    if (item.type === 'document' && item.document) {
      const success = await downloadDocument(item.document);
      if (!success) {
        console.error('Failed to download document:', item.document.id);
        // TODO: Show error toast/notification
      }
    }
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
                onDownload={handleDownload}
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
        .map(documentType => {
          const documents = yearData[documentType]
          const isLocked = !documents.some(doc => isDocumentVisibleToUser(doc, userRole))
          
          return {
            id: `type-${year}-${documentType}`,
            name: documentType,
            type: 'folder' as const,
            icon: Folder,
            itemCount: documents.length,
            isLocked,
            year,
            documentType
          }
        })
      
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
  
  // Use regex to find four-digit year (19xx or 20xx)
  const yearMatch = filename.match(/\b(19|20)\d{2}\b/)
  if (yearMatch) {
    return yearMatch[0]
  }
  
  // Fallback to created_at date
  return new Date(doc.created_at).getFullYear().toString()
}

// Helper function to check if a document is visible to a user role
function isDocumentVisibleToUser(doc: Document, userRole: UserRole): boolean {
  // If no visibility restrictions, document is visible
  if (!doc.visibility || doc.visibility.length === 0) {
    return true
  }
  
  // Check if user role has access to this document
  return doc.visibility.includes(userRole)
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


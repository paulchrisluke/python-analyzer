"use client"

import { useState } from "react"
import { Document } from "@/types/document"
import { UserRole, Phase, organizeDocumentsByPhase, getPhaseAccess } from "@/lib/document-utils"
import { PhaseTable } from "./PhaseTable"

interface DocumentManagerProps {
  documents: Document[]
}

export function DocumentManager({ documents }: DocumentManagerProps) {
  const [currentRole] = useState<UserRole>("admin") // Admin has full access

  const documentsByPhase = organizeDocumentsByPhase(documents)
  const totalDocuments = documents.length

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Document Management</h1>
        <p className="text-muted-foreground">Total documents: {totalDocuments}</p>
      </div>
      
      {(Object.entries(documentsByPhase) as [Phase, Document[]][]).map(([phase, documents]) => (
        <PhaseTable 
          key={phase} 
          phase={phase} 
          documents={documents} 
          hasAccess={getPhaseAccess(phase, currentRole)} 
        />
      ))}
    </div>
  )
}

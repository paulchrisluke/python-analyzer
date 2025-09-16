"use client"

import { useState, useEffect } from "react"
import { Document } from "@/types/document"
import { 
  getExpectedDocumentsForPhase, 
  getExpectedDocumentsForCategory,
  checkDocumentStatus,
  getPhaseCompletionStatus,
  Phase,
  PhaseCompletionStatus
} from "@/lib/document-utils"

interface ExpectedDocumentsStatusProps {
  documents: Document[]
  phase: Phase
  userRole: "admin" | "buyer" | "lawyer"
}

export function ExpectedDocumentsStatus({ documents, phase, userRole }: ExpectedDocumentsStatusProps) {
  const [completionStatus, setCompletionStatus] = useState<PhaseCompletionStatus | null>(null)

  useEffect(() => {
    const status = getPhaseCompletionStatus(phase, documents)
    setCompletionStatus(status)
    if (process.env.NODE_ENV === "development") {
      console.log(`Phase ${phase} completion status:`, status)
      
      // Log category statuses for debugging
      const phaseData = getExpectedDocumentsForPhase(phase)
      if (phaseData) {
        Object.keys(phaseData.expected_documents).forEach(category => {
          const statuses = checkDocumentStatus(phase, category, documents)
          console.log(`Category ${category} statuses:`, statuses)
        })
      }
    }
  }, [phase, documents])

  if (!completionStatus) {
    return <div>Loading...</div>
  }

  const phaseData = getExpectedDocumentsForPhase(phase)
  if (!phaseData) {
    return <div>No expected documents for phase {phase}</div>
  }

  const totalDocuments = completionStatus.total_required + completionStatus.total_optional
  const completedDocuments = completionStatus.completed_required + completionStatus.completed_optional

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', margin: '8px', borderRadius: '8px' }}>
      <h3>{phaseData.name}</h3>
      <p>{phaseData.description}</p>
      <p><strong>Completion:</strong> {completionStatus.completion_percentage}% ({completedDocuments}/{totalDocuments} documents)</p>
      <p><strong>Required:</strong> {completionStatus.completed_required}/{completionStatus.total_required}</p>
      <p><strong>Optional:</strong> {completionStatus.completed_optional}/{completionStatus.total_optional}</p>
      
      {completionStatus.missing_required.length > 0 && (
        <div>
          <p><strong>Missing Required:</strong></p>
          <ul>
            {completionStatus.missing_required.map((doc, index) => (
              <li key={index} style={{ color: 'red' }}>- {doc}</li>
            ))}
          </ul>
        </div>
      )}

      {completionStatus.missing_optional.length > 0 && (
        <div>
          <p><strong>Missing Optional:</strong></p>
          <ul>
            {completionStatus.missing_optional.map((doc, index) => (
              <li key={index} style={{ color: 'orange' }}>- {doc}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Show detailed status for each category */}
      <div style={{ marginTop: '16px' }}>
        <h4>Category Details:</h4>
        {Object.keys(phaseData.expected_documents).map(category => {
          const statuses = checkDocumentStatus(phase, category, documents)
          
          return (
            <div key={category} style={{ marginLeft: '16px', marginTop: '8px' }}>
              <h5>{category}</h5>
              {statuses.map((status, index) => (
                <div key={index} style={{ marginLeft: '16px', fontSize: '14px' }}>
                  <span style={{ color: status.status === 'uploaded' ? 'green' : 'red' }}>
                    {status.status === 'uploaded' ? '✓' : '✗'}
                  </span>
                  {' '}
                  {status.expected_document.name} 
                  {status.expected_document.required ? ' (Required)' : ' (Optional)'}
                  {status.actual_documents.length > 0 && (
                    <span style={{ color: 'blue' }}>
                      {' '}- Found {status.actual_documents.length} matching document(s)
                    </span>
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { FolderView } from '@/components/documents'
import { ExpectedDocumentsStatus } from '@/components/documents/ExpectedDocumentsStatus'
import { Document } from '@/types/document'
import { Phase } from '@/lib/document-utils'

export default function DocumentsPageClient() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const abortController = new AbortController()

    const fetchDocuments = async () => {
      try {
        setError(null)
        const response = await fetch('/api/documents', {
          signal: abortController.signal
        })

        // Validate HTTP status
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Parse JSON with error handling
        let data
        try {
          data = await response.json()
        } catch (parseError) {
          throw new Error('Invalid JSON response from server')
        }

        // Validate response structure
        if (data.success) {
          setDocuments(data.data || [])
        } else {
          throw new Error(data.error || 'Failed to fetch documents')
        }
      } catch (error) {
        // Don't update state if component was unmounted
        if (!abortController.signal.aborted) {
          if (error instanceof Error) {
            setError(error.message)
          } else {
            setError('An unexpected error occurred while fetching documents')
          }
          console.error('Error fetching documents:', error)
        }
      } finally {
        // Don't update loading state if component was unmounted
        if (!abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    fetchDocuments()

    // Cleanup function
    return () => {
      abortController.abort()
    }
  }, [])

  const handleAccessRequest = (folderId: string) => {
    console.log('Access request for folder:', folderId)
    // TODO: Implement access request handling
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Document Management" />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-muted-foreground">Loading documents...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  if (error) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Document Management" />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center">
              <div className="text-red-600 font-semibold mb-2">Error Loading Documents</div>
              <div className="text-muted-foreground mb-4">{error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader title="Document Management" />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
            {/* Expected Documents Status */}
            <div className="p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold mb-4">Document Completion Status</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {(['p1', 'p2a', 'p2b', 'p3a', 'p3b', 'p4', 'p5'] as Phase[]).map(phase => (
                  <ExpectedDocumentsStatus
                    key={phase}
                    documents={documents}
                    phase={phase}
                    userRole="admin"
                  />
                ))}
              </div>
            </div>
            
            {/* Document Library */}
            <FolderView 
              documents={documents} 
              userRole="admin"
              onAccessRequest={handleAccessRequest}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

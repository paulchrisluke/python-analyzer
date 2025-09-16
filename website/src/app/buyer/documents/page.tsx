"use client"

import { useEffect, useState } from "react"
import { AppSidebar } from '@/components/app-sidebar'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { FolderView } from '@/components/documents'
import { Document } from '@/types/document'

export default function BuyerDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    
    // Fetch documents from API
    fetch('/api/documents', { signal: controller.signal })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then(data => {
        if (data.success) {
          setDocuments(data.data || [])
        } else {
          throw new Error(data.message || 'Failed to fetch documents')
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Error fetching documents:', error)
          setError(error.message || 'Failed to load documents')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    // Cleanup function to abort the request
    return () => {
      controller.abort()
    }
  }, [])

  const handleAccessRequest = (folderId: string) => {
    console.log('Buyer access request for folder:', folderId)
    // TODO: Implement buyer access request handling
  }

  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader title="Due Diligence Documents" />
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
          <SiteHeader title="Due Diligence Documents" />
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="text-center">
              <div className="text-destructive mb-2">Error loading documents</div>
              <div className="text-muted-foreground text-sm">{error}</div>
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
        <SiteHeader title="Due Diligence Documents" />

        {/* Main Content */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col">
            <FolderView 
              documents={documents} 
              userRole="buyer"
              onAccessRequest={handleAccessRequest}
            />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
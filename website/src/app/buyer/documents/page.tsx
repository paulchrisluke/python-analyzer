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

  useEffect(() => {
    // Fetch documents from API
    fetch('/api/documents')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDocuments(data.data || [])
        }
      })
      .catch(error => {
        console.error('Error fetching documents:', error)
      })
      .finally(() => {
        setLoading(false)
      })
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
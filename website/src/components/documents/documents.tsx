"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { FolderView } from "./FolderView"
import { ContactForm } from "@/components/contact-form"
import { Document } from "@/types/document"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Lock, FileText, Shield, CheckCircle } from "lucide-react"

export function Documents() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showContactForm, setShowContactForm] = useState(false)
  
  const userRole = session?.user?.role
  const isAuthenticated = !!session?.user

  useEffect(() => {
    // Fetch documents from API (authenticated endpoint for logged-in users, public for others)
    const endpoint = isAuthenticated ? '/api/documents' : '/api/documents?public=true'
    fetch(endpoint)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        }
        return res.json()
      })
      .then(data => {
        // Validate response structure
        if (typeof data !== 'object' || data === null) {
          throw new Error('Invalid response: expected object but received ' + typeof data)
        }
        
        if (!('success' in data)) {
          throw new Error('Invalid response: missing "success" field')
        }
        
        if (!('data' in data)) {
          throw new Error('Invalid response: missing "data" field')
        }
        
        if (data.success) {
          setDocuments(data.data || [])
        } else {
          throw new Error('API returned success: false')
        }
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
        console.error('Error fetching documents:', error)
        setError(errorMessage)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [isAuthenticated])

  const handleAccessRequest = () => {
    console.log('Opening contact form for access request')
    setShowContactForm(true)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Due Diligence Documents</CardTitle>
          <CardDescription>Loading available documentation...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Due Diligence Documents</CardTitle>
          <CardDescription>Error loading documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-center space-y-2">
              <div className="text-destructive font-medium">Failed to load documents</div>
              <div className="text-sm text-muted-foreground">{error}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // If contact form is shown, display it instead of the document preview
  if (showContactForm) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Request Document Access</CardTitle>
                <CardDescription>
                  Complete the form below to access our comprehensive due diligence documents
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowContactForm(false)}
              >
                Back to Preview
              </Button>
            </div>
          </CardHeader>
        </Card>
        <ContactForm />
      </div>
    )
  }

  // For authenticated users, show full document access
  if (isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Due Diligence Documents</CardTitle>
          <CardDescription>
            Business documentation ({documents.length} documents)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FolderView 
            documents={documents} 
            userRole={userRole || 'buyer'}
            onAccessRequest={() => {}}
          />
        </CardContent>
      </Card>
    )
  }

  // For public users, show the contact form overlay
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Due Diligence Documents</CardTitle>
            <CardDescription>
              Available documentation for serious buyers ({documents.length} documents)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Compact document preview table */}
          <div className="pointer-events-none opacity-75">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.slice(0, 5).map((document) => {
                    const getDocumentIcon = (doc: any) => {
                      const fileType = doc.file_type?.toLowerCase()
                      if (fileType === 'pdf') return FileText
                      return FileText
                    }
                    const IconComponent = getDocumentIcon(document)
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{document.name || document.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{document.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">{document.file_type?.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {document.created_at ? new Date(document.created_at).getFullYear() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          
          {/* Compact overlay with access request */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center space-y-4 p-6 max-w-lg">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-muted">
                  <Shield className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-semibold">Document Access Required</h3>
                <p className="text-muted-foreground text-sm">
                  This library contains {documents.length} documents including:
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Financial statements and tax documents (2019-2025)</p>
                  <p>• Equipment specifications and purchase records</p>
                  <p>• Insurance policies and lease agreements</p>
                  <p>• Sales data and operational reports</p>
                </div>
              </div>
              
              <Button 
                size="default" 
                className="bg-black hover:bg-black/90 text-white px-6 py-2"
                onClick={handleAccessRequest}
              >
                <FileText className="h-4 w-4 mr-2" />
                Request Full Access
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Provide your information and sign NDA for access
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

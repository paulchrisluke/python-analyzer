"use client"

import { useEffect, useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSignIcon, BuildingIcon, ShieldIcon, UsersIcon, FileText, FileSpreadsheet } from "lucide-react"
import { Document } from "@/types/document"
import { getDocumentTypeLabel, getFileIconType, extractPeriod } from "@/lib/document-utils"


export function DueDiligenceDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    
    // Fetch real documents
    fetch('/api/documents', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDocuments(data.data || [])
        }
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Error fetching documents:', error)
          setError('Failed to load documents. Please try again later.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [])

  const getDocumentIcon = (doc: Document) => {
    const fileType = getFileIconType(doc)
    if (fileType === 'pdf') return FileText
    if (fileType === 'spreadsheet') return FileSpreadsheet
    return FileText
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
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="text-muted-foreground">Unable to load documents</div>
          </div>
        </CardContent>
      </Card>
    )
  }

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
          {/* Document table with disabled interactions */}
          <div className="pointer-events-none opacity-75">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Period</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.slice(0, 8).map((document) => {
                    const IconComponent = getDocumentIcon(document)
                    return (
                      <TableRow key={document.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{document.name || document.id}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{document.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{document.file_type.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>{document.file_size_display}</TableCell>
                        <TableCell>
                          {extractPeriod(document)}
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
                  <ShieldIcon className="h-8 w-8 text-muted-foreground" />
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
                asChild
              >
                <a href="/buyer/documents">Request Full Access</a>
              </Button>
              
              <p className="text-xs text-muted-foreground">
                Provide your information and business details
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}


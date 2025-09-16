"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MoreHorizontal, Lock, Download, Eye, FileText, FileSpreadsheet } from "lucide-react"
import { Document } from "@/types/document"
import { Phase, getPhaseLabel, getDocumentTypeLabel, getDocumentDisplayName, getFileIconType, extractPeriod } from "@/lib/document-utils"

interface PhaseTableProps {
  phase: Phase
  documents: Document[]
  hasAccess: boolean
}

export function PhaseTable({ phase, documents, hasAccess }: PhaseTableProps) {
  if (documents.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{getPhaseLabel(phase)}</h2>
        <span className="text-sm text-muted-foreground">{documents.length} documents</span>
      </div>

      <div className={`border rounded-lg ${!hasAccess ? "opacity-50" : ""}`}>
        {!hasAccess && (
          <div className="bg-muted/30 border-b px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Access restricted for this phase</span>
            <Button variant="default" size="sm" className="bg-black hover:bg-black/90 text-white gap-2">
              <Lock className="h-4 w-4" />
              Request Access
            </Button>
          </div>
        )}

        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Document Type</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>File Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((doc) => (
              <TableRow
                key={doc.id}
                className={`hover:bg-muted/50 ${!hasAccess ? "pointer-events-none" : ""}`}
              >
                <TableCell>
                  <div className="text-sm font-medium">{getDocumentTypeLabel(doc)}</div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{extractPeriod(doc)}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getFileIconType(doc) === "pdf" ? (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    ) : getFileIconType(doc) === "spreadsheet" ? (
                      <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="font-medium text-sm">
                      {getDocumentDisplayName(doc)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{doc.file_size_display}</span>
                </TableCell>
                <TableCell>
                  {hasAccess && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

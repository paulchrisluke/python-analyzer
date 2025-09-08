"use client"

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
import { DollarSignIcon, BuildingIcon, ShieldIcon, UsersIcon } from "lucide-react"

const dueDiligenceDocuments = [
  // Financial Documents
  {
    id: "1",
    name: "Profit & Loss Statements (2023-2024)",
    type: "Financial",
    category: "Financial Documents",
    status: "completed",
    size: "2.5MB",
    lastModified: "2024-12-15",
    icon: DollarSignIcon,
  },
  {
    id: "2", 
    name: "Balance Sheets (2022-2024)",
    type: "Financial",
    category: "Financial Documents",
    status: "completed",
    size: "1.8MB",
    lastModified: "2024-12-10",
    icon: DollarSignIcon,
  },
  {
    id: "3",
    name: "General Ledger (2021-2025)",
    type: "Financial",
    category: "Financial Documents",
    status: "completed", 
    size: "3.2MB",
    lastModified: "2024-12-12",
    icon: DollarSignIcon,
  },
  {
    id: "4",
    name: "Tax Returns (2021-2023)",
    type: "Financial",
    category: "Financial Documents",
    status: "completed",
    size: "3.1MB", 
    lastModified: "2024-12-05",
    icon: DollarSignIcon,
  },
  // Operational Documents
  {
    id: "5",
    name: "Equipment Inventory & Valuations ($61,728)",
    type: "Equipment",
    category: "Operational Documents",
    status: "completed",
    size: "850KB",
    lastModified: "2024-12-08",
    icon: BuildingIcon,
  },
  {
    id: "6",
    name: "Lease Agreements (Leased)",
    type: "Legal",
    category: "Operational Documents",
    status: "completed",
    size: "1.2MB", 
    lastModified: "2024-12-12",
    icon: BuildingIcon,
  },
  {
    id: "7",
    name: "Insurance Policies (2 providers)",
    type: "Legal", 
    category: "Operational Documents",
    status: "completed",
    size: "650KB",
    lastModified: "2024-11-28",
    icon: ShieldIcon,
  },
  {
    id: "8",
    name: "Staff Information & Contracts",
    type: "HR",
    category: "Operational Documents",
    status: "completed",
    size: "420KB",
    lastModified: "2024-12-01",
    icon: UsersIcon,
  }
]

export function DueDiligenceDocuments() {
  console.log("📄 DueDiligenceDocuments rendering");
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Due Diligence Documents</CardTitle>
            <CardDescription>
              Available documentation for serious buyers
            </CardDescription>
          </div>
          <Button size="sm">
            Request Full Due Diligence Package
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dueDiligenceDocuments.map((document) => {
                const IconComponent = document.icon;
                return (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{document.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{document.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{document.type}</Badge>
                    </TableCell>
                    <TableCell>{document.size}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

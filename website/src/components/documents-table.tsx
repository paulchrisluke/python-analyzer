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
import { FileTextIcon, DownloadIcon } from "lucide-react"

const documents = [
  {
    id: "1",
    name: "Financial Statements 2023-2024",
    type: "Financial",
    status: "completed",
    size: "2.5MB",
    lastModified: "2024-12-15",
  },
  {
    id: "2", 
    name: "Balance Sheets 2022-2024",
    type: "Financial",
    status: "completed",
    size: "1.8MB",
    lastModified: "2024-12-10",
  },
  {
    id: "3",
    name: "Equipment Inventory",
    type: "Equipment",
    status: "completed", 
    size: "850KB",
    lastModified: "2024-12-08",
  },
  {
    id: "4",
    name: "Lease Agreements",
    type: "Legal",
    status: "in-progress",
    size: "1.2MB", 
    lastModified: "2024-12-12",
  },
  {
    id: "5",
    name: "Tax Returns 2021-2023",
    type: "Financial",
    status: "completed",
    size: "3.1MB",
    lastModified: "2024-12-05",
  },
  {
    id: "6",
    name: "Insurance Policies",
    type: "Legal", 
    status: "pending",
    size: "650KB",
    lastModified: "2024-11-28",
  }
]

export function DocumentsTable() {
  console.log("📄 DocumentsTable rendering");
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Due Diligence Documents</CardTitle>
            <CardDescription>
              Available documentation for business evaluation
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Customize Columns
            </Button>
            <Button size="sm">
              Add Section
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Last Modified</TableHead>
                <TableHead className="w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((document) => (
                <TableRow key={document.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{document.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{document.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        document.status === "completed" ? "default" :
                        document.status === "in-progress" ? "secondary" : "outline"
                      }
                    >
                      {document.status === "completed" ? "Completed" :
                       document.status === "in-progress" ? "In Progress" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell>{document.size}</TableCell>
                  <TableCell>
                    {new Date(document.lastModified).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <DownloadIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {documents.map((document) => (
            <div key={document.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileTextIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <span className="font-medium text-sm truncate">{document.name}</span>
                </div>
                <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0">
                  <DownloadIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">{document.type}</Badge>
                <Badge 
                  variant={
                    document.status === "completed" ? "default" :
                    document.status === "in-progress" ? "secondary" : "outline"
                  }
                  className="text-xs"
                >
                  {document.status === "completed" ? "Completed" :
                   document.status === "in-progress" ? "In Progress" : "Pending"}
                </Badge>
              </div>
              
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{document.size}</span>
                <span>{new Date(document.lastModified).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

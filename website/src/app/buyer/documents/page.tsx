"use client"

import { useAuth } from "@/lib/simple-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Building2, 
  FileText, 
  Download,
  Search,
  Calendar,
  Filter,
  Eye
} from "lucide-react"

export default function BuyerDocuments() {
  const { user, signOut } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  // Mock document data - in a real app, this would come from an API
  const documents = [
    {
      id: 1,
      name: "Financial Statements 2023",
      type: "Financial",
      date: "2024-01-15",
      size: "2.4 MB",
      status: "Available"
    },
    {
      id: 2,
      name: "Business Overview Report",
      type: "Business",
      date: "2024-01-10",
      size: "1.8 MB",
      status: "Available"
    },
    {
      id: 3,
      name: "Equipment Inventory",
      type: "Operational",
      date: "2024-01-08",
      size: "3.2 MB",
      status: "Available"
    },
    {
      id: 4,
      name: "Legal Documents",
      type: "Legal",
      date: "2024-01-05",
      size: "4.1 MB",
      status: "Available"
    },
    {
      id: 5,
      name: "Insurance Policies",
      type: "Legal",
      date: "2024-01-03",
      size: "2.7 MB",
      status: "Available"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Due Diligence Documents</h1>
                <p className="text-sm text-gray-500">Access business documents and reports</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {user.role.toUpperCase()}
              </Badge>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search documents..." 
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filter</span>
            </Button>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Card key={doc.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <CardTitle className="text-lg">{doc.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {doc.type} • {doc.size}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    {doc.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(doc.date).toLocaleDateString()}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button size="sm" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Document Categories */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-6">Document Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-medium">Financial</h3>
                <p className="text-sm text-gray-500">12 documents</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Building2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-medium">Business</h3>
                <p className="text-sm text-gray-500">8 documents</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-medium">Legal</h3>
                <p className="text-sm text-gray-500">15 documents</p>
              </CardContent>
            </Card>
            
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <h3 className="font-medium">Operational</h3>
                <p className="text-sm text-gray-500">6 documents</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

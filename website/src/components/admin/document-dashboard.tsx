'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Upload, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  Download
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Document, DocumentCategory, CoverageAnalysis, DocumentStats } from '@/types/document';
import { 
  formatFileSize, 
  getDocumentStatusColor, 
  getDocumentStatusBadge,
  getCategoryColor,
  calculateCoveragePercentage,
  getCoverageStatus,
  formatDate
} from '@/lib/document-utils';

interface DocumentDashboardProps {
  initialData?: {
    documents: Document[];
    categories: DocumentCategory[];
    coverage: CoverageAnalysis;
    stats: DocumentStats;
  };
}

export function DocumentDashboard({ initialData }: DocumentDashboardProps) {
  const [documents, setDocuments] = useState<Document[]>(initialData?.documents || []);
  const [categories, setCategories] = useState<DocumentCategory[]>(initialData?.categories || []);
  const [coverage, setCoverage] = useState<CoverageAnalysis | null>(initialData?.coverage || null);
  const [stats, setStats] = useState<DocumentStats | null>(initialData?.stats || null);
  const [loading, setLoading] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    if (!initialData) {
      fetchDashboardData();
    }
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [documentsRes, categoriesRes, coverageRes] = await Promise.all([
        fetch('/api/documents'),
        fetch('/api/categories?with_counts=true'),
        fetch('/api/analytics/coverage')
      ]);

      const [documentsData, categoriesData, coverageData] = await Promise.all([
        documentsRes.json(),
        categoriesRes.json(),
        coverageRes.json()
      ]);

      if (documentsData.success) setDocuments(documentsData.data);
      if (categoriesData.success) setCategories(categoriesData.data);
      if (coverageData.success) setCoverage(coverageData.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show all documents
  const filteredDocuments = documents;

  const getCategoryName = (categoryName: string) => {
    return categoryName || 'Uncategorized';
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleDocumentUpdate = async (documentId: string, updates: Partial<Document>) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        const updatedDoc = await response.json();
        setDocuments(prev => prev.map(doc => 
          doc.id === documentId ? updatedDoc.data : doc
        ));
        // Refresh coverage data
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Error updating document:', error);
    }
  };

  if (loading && !initialData) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Loading document dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-gray-600">Track and manage business documents</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.expected} expected
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Found Documents</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.found}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.found / stats.total) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Documents</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.missing}</div>
              <p className="text-xs text-muted-foreground">
                {Math.round((stats.missing / stats.total) * 100)}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coverage</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {coverage ? `${coverage.overall_coverage}%` : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                {coverage && getCoverageStatus(coverage.overall_coverage).status}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Coverage Analysis */}
      {coverage && (
        <Card>
          <CardHeader>
            <CardTitle>Coverage Analysis</CardTitle>
            <CardDescription>Document coverage by category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {coverage.categories.map((category) => (
                <div key={category.category_name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(category.category_name)}>
                        {category.category_name}
                      </Badge>
                      <span className="text-sm font-medium">
                        {category.found_documents} / {category.expected_documents}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${getCoverageStatus(category.coverage_percentage).color}`}>
                      {category.coverage_percentage}%
                    </span>
                  </div>
                  <Progress value={category.coverage_percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Document Management */}
      <div className="space-y-4">

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Documents ({filteredDocuments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Name</th>
                      <th className="text-left p-2">Category</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Size</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Updated</th>
                      <th className="text-left p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <div className="font-medium">{doc.name}</div>
                          {doc.notes && (
                            <div className="text-sm text-gray-500">{doc.notes}</div>
                          )}
                        </td>
                        <td className="p-2">
                          <Badge className={getCategoryColor(getCategoryName(doc.category))}>
                            {getCategoryName(doc.category)}
                          </Badge>
                        </td>
                        <td className="p-2">{doc.file_type || 'N/A'}</td>
                        <td className="p-2">{doc.file_size_display || 'N/A'}</td>
                        <td className="p-2">
                          <Badge 
                            variant={doc.status ? "default" : "destructive"}
                            className={getDocumentStatusColor(doc.status)}
                          >
                            {getDocumentStatusBadge(doc.status)}
                          </Badge>
                        </td>
                        <td className="p-2 text-sm text-gray-500">
                          {formatDate(doc.updated_at)}
                        </td>
                        <td className="p-2">
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDocumentUpdate(doc.id, { status: !doc.status })}
                            >
                              {doc.status ? 'Mark Missing' : 'Mark Found'}
                            </Button>
                            <Button size="sm" variant="outline">
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

      </div>
    </div>
  );
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Download, Eye, EyeOff } from "lucide-react"

interface PipelineData {
  revenue?: any
  ebitda?: any
  loading: boolean
  error?: string
}

export default function AdminPage() {
  const [data, setData] = useState<PipelineData>({
    revenue: null,
    ebitda: null,
    loading: true,
    error: undefined
  })
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const loadData = async () => {
    setData(prev => ({ ...prev, loading: true, error: undefined }))
    
    try {
      // Load revenue data
      const revenueResponse = await fetch('/data/revenue_audit_trail.json')
      const revenueData = revenueResponse.ok ? await revenueResponse.json() : null
      
      // Load EBITDA data
      const ebitdaResponse = await fetch('/data/ebitda_audit_trail.json')
      const ebitdaData = ebitdaResponse.ok ? await ebitdaResponse.json() : null
      
      setData({
        revenue: revenueData,
        ebitda: ebitdaData,
        loading: false,
        error: undefined
      })
      
      setLastUpdated(new Date().toLocaleString())
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }))
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const downloadData = (type: 'revenue' | 'ebitda') => {
    const dataToDownload = type === 'revenue' ? data.revenue : data.ebitda
    if (!dataToDownload) return
    
    const blob = new Blob([JSON.stringify(dataToDownload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type}_audit_trail.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const renderJsonSection = (title: string, sectionData: any, type: 'revenue' | 'ebitda') => {
    const isExpanded = expandedSections[type]
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {title}
                <Badge variant={sectionData ? "default" : "secondary"}>
                  {sectionData ? "Loaded" : "Not Available"}
                </Badge>
              </CardTitle>
              <CardDescription>
                {type === 'revenue' 
                  ? "Revenue pipeline data with projections and audit trail"
                  : "EBITDA pipeline data with calculations and audit trail"
                }
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSection(type)}
              >
                {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {isExpanded ? "Hide" : "Show"} JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadData(type)}
                disabled={!sectionData}
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sectionData && (
            <div className="space-y-4">
              {/* Summary Cards */}
              {type === 'revenue' && sectionData.pipeline_run && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Total Revenue</div>
                      <div className="text-2xl font-bold">
                        {formatNumber(sectionData.pipeline_run.total_revenue || 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Projected Revenue</div>
                      <div className="text-2xl font-bold">
                        {formatNumber(sectionData.pipeline_run.projections?.total_projected_revenue || 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Files Processed</div>
                      <div className="text-2xl font-bold">
                        {sectionData.pipeline_run.files_processed?.length || 0}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {type === 'ebitda' && sectionData.summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Total EBIT</div>
                      <div className="text-2xl font-bold">
                        {formatNumber(sectionData.summary.total_ebit || 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Net Income</div>
                      <div className="text-2xl font-bold">
                        {formatNumber(sectionData.summary.total_net_income || 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Interest</div>
                      <div className="text-2xl font-bold">
                        {formatNumber(sectionData.summary.total_interest_expenses || 0)}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm font-medium text-muted-foreground">Taxes</div>
                      <div className="text-2xl font-bold">
                        {formatNumber(sectionData.summary.total_taxes || 0)}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* JSON Data */}
              {isExpanded && (
                <div className="mt-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <pre className="text-sm overflow-auto max-h-96">
                      {JSON.stringify(sectionData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {!sectionData && !data.loading && (
            <div className="text-center py-8 text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Pipeline data and audit trails
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <div className="text-sm text-muted-foreground">
              Last updated: {lastUpdated}
            </div>
          )}
          <Button onClick={loadData} disabled={data.loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${data.loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
        </div>
      </div>

      {data.error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="text-destructive font-medium">Error loading data</div>
            <div className="text-sm text-muted-foreground">{data.error}</div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Pipeline</TabsTrigger>
          <TabsTrigger value="ebitda">EBITDA Pipeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Pipeline Status</CardTitle>
                <CardDescription>Latest revenue calculations and projections</CardDescription>
              </CardHeader>
              <CardContent>
                {data.revenue ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total Revenue:</span>
                      <span className="font-medium">
                        {formatNumber(data.revenue.pipeline_run?.total_revenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Projected Revenue:</span>
                      <span className="font-medium">
                        {formatNumber(data.revenue.pipeline_run?.projections?.total_projected_revenue || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Files Processed:</span>
                      <span className="font-medium">
                        {data.revenue.pipeline_run?.files_processed?.length || 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>EBITDA Pipeline Status</CardTitle>
                <CardDescription>Latest EBITDA calculations and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                {data.ebitda ? (
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Total EBIT:</span>
                      <span className="font-medium">
                        {formatNumber(data.ebitda.summary?.total_ebit || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Net Income:</span>
                      <span className="font-medium">
                        {formatNumber(data.ebitda.summary?.total_net_income || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Months Analyzed:</span>
                      <span className="font-medium">
                        {data.ebitda.summary?.months_analyzed || 0}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-muted-foreground">No data available</div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="revenue">
          {renderJsonSection("Revenue Pipeline Data", data.revenue, 'revenue')}
        </TabsContent>
        
        <TabsContent value="ebitda">
          {renderJsonSection("EBITDA Pipeline Data", data.ebitda, 'ebitda')}
        </TabsContent>
      </Tabs>
    </div>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardAction, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RefreshCw, Download, Eye, EyeOff, FileText, Calculator, TrendingUp, DollarSign, FileCheck, Plus } from "lucide-react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

// Helper functions for consistent filename parsing
function extractYearFromFilename(filename: string): string {
  const match = filename.match(/^\s*(\d{4})[-_]/)
  return match ? match[1] : 'Unknown'
}

function extractPeriodFromFilename(filename: string): string {
  const match = filename.match(/^\s*(\d{4})[-_](\d{2})/)
  if (match) {
    return `${match[1]}-${match[2]}`
  }
  return filename // fallback to original filename
}

interface PipelineData {
  revenue?: any
  ebitda?: any
  loading: boolean
  error?: string
}

function AdminPageContent() {
  const [data, setData] = useState<PipelineData>({
    revenue: null,
    ebitda: null,
    loading: true,
    error: undefined
  })
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['2023-0', 'ebitda-2023-0']))
  const [lastUpdated, setLastUpdated] = useState<string>("")

  const loadData = async () => {
    setData(prev => ({ ...prev, loading: true, error: undefined }))
    
    try {
      // Load revenue data
      const revenueResponse = await fetch('/data/revenue_audit_trail.json')
      const revenueData = revenueResponse.ok ? await revenueResponse.json() : null
      
      // Load EBIT data
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

  const toggleRowExpansion = (rowId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(rowId)) {
        newSet.delete(rowId)
      } else {
        newSet.add(rowId)
      }
      return newSet
    })
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

  const formatPlainNumber = (num: number) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num)
  }

  const renderSectionCard = (title: string, value: string | number, description: string, icon: React.ReactNode, badge?: string, isCurrency?: boolean, badgeIcon?: React.ReactNode) => (
    <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
      <CardHeader>
        <CardDescription>{title}</CardDescription>
        <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {typeof value === 'number' ? (isCurrency ? formatNumber(value) : formatPlainNumber(value)) : value}
        </CardTitle>
        {badge && (
          <CardAction>
            <Badge variant="outline" className="text-xs">
              {badgeIcon || <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />}
              {badge}
            </Badge>
          </CardAction>
        )}
      </CardHeader>
      <CardFooter className="flex-col items-start gap-1.5 text-sm">
        <div className="line-clamp-1 flex gap-2 font-medium">
          {description} <span aria-hidden="true">{icon}</span>
        </div>
        <div className="text-muted-foreground">
          Pipeline data
        </div>
      </CardFooter>
    </Card>
  )

  const renderJsonSection = (title: string, sectionData: any, type: 'revenue' | 'ebitda') => {
    const isExpanded = expandedSections[type]
    
    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {type === 'revenue' 
              ? "Revenue pipeline data with projections and audit trail"
              : "EBIT pipeline data with calculations and audit trail"
            }
          </p>
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
        
        {sectionData && isExpanded && (
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-auto max-h-96">
              {JSON.stringify(sectionData, null, 2)}
            </pre>
          </div>
        )}
        
        {!sectionData && !data.loading && (
          <div className="text-center py-8 text-muted-foreground">
            No data available
          </div>
        )}
      </div>
    )
  }

  const renderRevenueFilesTable = () => {
    if (!data.revenue?.pipeline_run?.files_processed) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Revenue Files Processed
            </CardTitle>
            <CardDescription>Detailed breakdown of files used in revenue calculations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No file data available
            </div>
          </CardContent>
        </Card>
      )
    }

    const files = data.revenue.pipeline_run.files_processed
    let runningTotal = 0

    // Calculate running totals and sort files chronologically
    const filesWithTotals = files.map((file: any) => {
      runningTotal += file.revenue || 0
      return {
        ...file,
        runningTotal: runningTotal
      }
    })

    // Group files by year for better organization
    const filesByYear = filesWithTotals.reduce((acc: any, file: any) => {
      const year = extractYearFromFilename(file.file) // Extract year from filename
      if (!acc[year]) acc[year] = []
      acc[year].push(file)
      return acc
    }, {})

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Revenue Calculation Audit Trail ({files.length} files)
          </h3>
          <p className="text-sm text-muted-foreground">Step-by-step breakdown showing how total revenue was calculated from individual files</p>
        </div>
        <div className="space-y-6">
            {/* Files by Year */}
            {Object.entries(filesByYear).map(([year, yearFiles]: [string, any]) => (
              <div key={year} className="space-y-2">
                <h4 className="font-medium text-lg border-b pb-2">
                  {year} ({yearFiles.length} files)
                </h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                            <TableHead>Line Item Used</TableHead>
                            <TableHead>Revenue</TableHead>
                            <TableHead>File</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearFiles.map((file: any, index: number) => {
                        const isLastInYear = index === yearFiles.length - 1
                        return (
                          <TableRow 
                            key={index} 
                            className={`${isLastInYear ? "border-b-2 border-primary" : ""} ${file.sales_line_items && file.sales_line_items.length > 0 ? "cursor-pointer hover:bg-muted/50" : ""}`}
                            onClick={() => file.sales_line_items && file.sales_line_items.length > 0 && toggleRowExpansion(`${year}-${index}`)}
                          >
                            <TableCell>
                              {file.sales_line_items && file.sales_line_items.length > 0 ? (
                                <div>
                                  <div className="text-sm">
                                    {file.sales_line_items.length} line item{file.sales_line_items.length !== 1 ? 's' : ''}
                                  </div>
                                  {expandedRows.has(`${year}-${index}`) && (
                                    <div className="mt-2 space-y-1">
                                      {file.sales_line_items.map((item: any, idx: number) => (
                                        <div key={idx} className="text-sm">
                                          <div className="flex justify-between items-center">
                                            <span className="truncate flex-1" title={typeof item === 'string' ? item : item.name}>
                                              {typeof item === 'object' && item.value !== undefined && item.value >= 0 ? '+' : ''}
                                              {typeof item === 'string' ? item : item.name}
                                            </span>
                                            {typeof item === 'object' && item.value !== undefined && (
                                              <span className="font-mono ml-2 text-right whitespace-nowrap">
                                                {formatNumber(item.value)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      <div className="border-t border-muted-foreground/20 my-2"></div>
                                      <div className="text-sm font-bold">
                                        <div className="flex justify-between items-center">
                                          <span>Total Revenue</span>
                                          <span className="font-mono">
                                            {formatNumber(file.revenue || 0)}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground">No line items</span>
                              )}
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {formatNumber(file.revenue || 0)}
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="max-w-xs">
                                <div className="truncate" title={file.file}>
                                  {extractPeriodFromFilename(file.file)} {/* Show just the date part */}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {file.calculation_details?.method}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </div>
    )
  }

  const renderEBITDAFilesTable = () => {
    if (!data.ebitda?.monthly_calculations) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              EBIT Data Sources
            </CardTitle>
            <CardDescription>Files used in EBIT calculations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              No data sources available
            </div>
          </CardContent>
        </Card>
      )
    }

    const monthlyCalculations = data.ebitda.monthly_calculations
    const summary = data.ebitda.summary

    // Group files by year
    const filesByYear = monthlyCalculations.reduce((acc: any, calculation: any) => {
      const year = extractYearFromFilename(calculation.month)
      if (!acc[year]) acc[year] = []
      acc[year].push(calculation)
      return acc
    }, {})

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            EBIT Calculation Data Sources ({monthlyCalculations.length} files)
          </h3>
          <p className="text-sm text-muted-foreground">Files used to calculate EBIT components and their contribution to final numbers</p>
        </div>
        <div className="space-y-6">
            {/* Files by Year */}
            {Object.entries(filesByYear).map(([year, yearFiles]: [string, any]) => (
              <div key={year} className="space-y-2">
                <h4 className="font-medium text-lg border-b pb-2">
                  {year} P&L Files ({yearFiles.length} files)
                </h4>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fields Used</TableHead>
                        <TableHead>EBIT</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>File</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {yearFiles.map((calculation: any, index: number) => {
                        const month = extractPeriodFromFilename(calculation.month).split('-')[1] || 'Unknown'
                        const isLastInYear = index === yearFiles.length - 1
                        
                        // Flatten all fields from all locations
                        const allFields = calculation.fields_analyzed?.flatMap((location: any) => location.fields_found || []) || []
                        
                        return (
                          <TableRow
                            key={index}
                            className={`${isLastInYear ? "border-b-2 border-primary" : ""} cursor-pointer hover:bg-muted/50`}
                            onClick={() => toggleRowExpansion(`ebitda-${year}-${index}`)}
                          >
                            <TableCell>
                              <div className="text-sm">
                                {calculation.ebit_calculation ? (
                                  <div>
                                    <div className="text-sm">
                                      3 components
                                    </div>
                                    {expandedRows.has(`ebitda-${year}-${index}`) && (
                                      <div className="mt-2 space-y-1">
                                        <div className="text-sm">
                                          <div className="flex justify-between items-center">
                                            <span className="truncate flex-1">
                                              {calculation.ebit_calculation.net_income >= 0 ? '+' : ''}Net Income
                                            </span>
                                            <span className="font-mono ml-2 text-right whitespace-nowrap">
                                              {formatNumber(calculation.ebit_calculation.net_income)}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-sm">
                                          <div className="flex justify-between items-center">
                                            <span className="truncate flex-1">
                                              {calculation.ebit_calculation.interest_expenses >= 0 ? '+' : ''}Interest Expenses
                                            </span>
                                            <span className="font-mono ml-2 text-right whitespace-nowrap">
                                              {formatNumber(calculation.ebit_calculation.interest_expenses)}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="text-sm">
                                          <div className="flex justify-between items-center">
                                            <span className="truncate flex-1">
                                              {calculation.ebit_calculation.taxes >= 0 ? '+' : ''}Taxes
                                            </span>
                                            <span className="font-mono ml-2 text-right whitespace-nowrap">
                                              {formatNumber(calculation.ebit_calculation.taxes)}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="border-t border-muted-foreground/20 my-2"></div>
                                        <div className="text-sm font-bold">
                                          <div className="flex justify-between items-center">
                                            <span>Total EBIT</span>
                                            <span className="font-mono">
                                              {formatNumber(calculation.ebit_calculation.ebit)}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No calculation data</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="font-mono font-medium">
                              {formatNumber(calculation.ebit_calculation?.ebit || 0)}
                            </TableCell>
                            <TableCell>
                              <div className="text-sm font-medium">{year}-{month}</div>
                            </TableCell>
                            <TableCell className="font-medium">
                              <div className="max-w-xs">
                                <div className="truncate" title={calculation.filename}>
                                  {extractPeriodFromFilename(calculation.filename)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  P&L Statement
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </div>
        </div>
    )
  }

  const renderRevenueCalculationDetails = () => {
    const revenueSteps = data.revenue?.pipeline_run?.business_rules
    const files = data.revenue?.pipeline_run?.files_processed || []
    const totalRevenue = data.revenue?.pipeline_run?.total_revenue || 0

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Revenue Calculation Methodology
          </CardTitle>
          <CardDescription>Step-by-step breakdown of how the total revenue number was calculated</CardDescription>
        </CardHeader>
        <CardContent>
          {revenueSteps ? (
            <div className="space-y-6">
              {/* Step-by-Step Process */}
              <div>
                <h4 className="font-medium mb-3">Calculation Process:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <div className="font-medium">File Processing</div>
                      <div className="text-sm text-muted-foreground">
                        Processed {files.length} monthly P&L files chronologically
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <div className="font-medium">Location Filtering</div>
                      <div className="text-sm text-muted-foreground">
                        Extracted only Pennsylvania revenue from each file, excluding Virginia operations
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <div className="font-medium">Aggregation</div>
                      <div className="text-sm text-muted-foreground">
                        Summed all Pennsylvania revenue values to reach final total
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Rules */}
              <div>
                <h4 className="font-medium mb-2">Business Rules Applied:</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium mb-1">Include Locations:</div>
                      <div className="text-muted-foreground">{revenueSteps.include_locations?.join(', ')}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Exclude Locations:</div>
                      <div className="text-muted-foreground">{revenueSteps.exclude_locations?.join(', ')}</div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="font-medium mb-1">Reasoning:</div>
                    <div className="text-muted-foreground">{revenueSteps.reasoning}</div>
                  </div>
                </div>
              </div>

              {/* Mathematical Summary */}
              <div>
                <h4 className="font-medium mb-2">Mathematical Summary:</h4>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <div className="space-y-1">
                    <div>Total Files Processed: {files.length}</div>
                    <div>Files with Data: {files.filter((f: any) => f.has_data).length}</div>
                    <div>Average per File: {files.length > 0 ? formatNumber(totalRevenue / files.length) : "—"}</div>
                    <div className="pt-2 border-t font-bold text-lg">
                      Final Total: {formatNumber(totalRevenue)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pipeline Details */}
              <div>
                <h4 className="font-medium mb-2">Pipeline Run Details:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>Run Timestamp: {data.revenue?.pipeline_run?.timestamp}</div>
                  <div>Purpose: {data.revenue?.pipeline_run?.purpose}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No revenue calculation details available
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderCalculationSteps = () => {
    const ebitdaSteps = data.ebitda?.configuration
    const summary = data.ebitda?.summary
    const dataSources = data.ebitda?.data_sources || []

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            EBIT Calculation Methodology
          </CardTitle>
          <CardDescription>Step-by-step breakdown of how EBIT numbers were calculated from financial data</CardDescription>
        </CardHeader>
        <CardContent>
          {ebitdaSteps ? (
            <div className="space-y-6">
              {/* Step-by-Step Process */}
              <div>
                <h4 className="font-medium mb-3">Calculation Process:</h4>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <div className="font-medium">Data Extraction</div>
                      <div className="text-sm text-muted-foreground">
                        Extracted Net Income, Interest Expenses, and Taxes from {dataSources.length} P&L files
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <div className="font-medium">Location Filtering</div>
                      <div className="text-sm text-muted-foreground">
                        Applied location filters to include only Pennsylvania operations
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <div className="font-medium">Component Aggregation</div>
                      <div className="text-sm text-muted-foreground">
                        Summed all components across the analysis period
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <div className="font-medium">EBIT Calculation</div>
                      <div className="text-sm text-muted-foreground">
                        Applied formula: Net Income + Interest + Taxes = EBIT
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Formula with Actual Values */}
              <div>
                <h4 className="font-medium mb-2">Formula with Actual Values:</h4>
                <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{formatNumber(summary?.total_net_income || 0)}</span>
                      <span>(Net Income)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>+ {formatNumber(summary?.total_interest_expenses || 0)}</span>
                      <span>(Interest Expenses)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>+ {formatNumber(summary?.total_taxes || 0)}</span>
                      <span>(Taxes)</span>
                    </div>
                    <div className="border-t pt-2 flex items-center gap-2">
                      <span className="font-bold text-lg">= {formatNumber(summary?.total_ebit || 0)}</span>
                      <span className="font-bold">(Total EBIT)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Configuration Details */}
              <div>
                <h4 className="font-medium mb-2">Configuration Details:</h4>
                <div className="bg-muted p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium mb-1">Analysis Period:</div>
                      <div className="text-muted-foreground">
                        {ebitdaSteps.analysis_period?.start_date} to {ebitdaSteps.analysis_period?.end_date}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Location Filtering:</div>
                      <div className="text-muted-foreground">
                        Include: {ebitdaSteps.locations?.include_states?.join(', ')}<br/>
                        Exclude: {ebitdaSteps.locations?.exclude_states?.join(', ')}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Calculation Method:</div>
                      <div className="text-muted-foreground">{ebitdaSteps.ebitda_calculation?.method}</div>
                    </div>
                    <div>
                      <div className="font-medium mb-1">Pipeline Version:</div>
                      <div className="text-muted-foreground">
                        {data.ebitda?.pipeline_info?.name} v{data.ebitda?.pipeline_info?.version}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t">
                    <div className="font-medium mb-1">Important Note:</div>
                    <div className="text-muted-foreground">{ebitdaSteps.ebitda_calculation?.note}</div>
                  </div>
                </div>
              </div>

              {/* Data Quality Summary */}
              <div>
                <h4 className="font-medium mb-2">Data Quality Summary:</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-lg">{dataSources.length}</div>
                      <div className="text-sm text-muted-foreground">Files Processed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-lg">{summary?.months_analyzed || 0}</div>
                      <div className="text-sm text-muted-foreground">Months Analyzed</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="font-bold text-lg">EBIT</div>
                      <div className="text-sm text-muted-foreground">Calculation Type</div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              No EBIT calculation details available
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading pipeline data...</p>
        </div>
      </div>
    )
  }

  if (data.error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-destructive mb-4">Error: {data.error}</p>
          <Button onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-6">
              <div className="flex items-center gap-4 mb-4">
                <Button onClick={loadData} disabled={data.loading}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${data.loading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
                {lastUpdated && (
                  <span className="text-sm text-muted-foreground">
                    Last updated: {lastUpdated}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              {/* Overview Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Pipeline Overview</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {data.revenue && (
                    <>
                      {renderSectionCard(
                        "Total Revenue",
                        data.revenue.pipeline_run?.total_revenue || 0,
                        "Historical revenue",
                        <DollarSign className="size-4" aria-hidden="true" />,
                        "Loaded",
                        true,
                        <DollarSign className="h-3 w-3 mr-1" aria-hidden="true" />
                      )}
                      {renderSectionCard(
                        "Projected Revenue",
                        data.revenue.pipeline_run?.projections?.total_projected_revenue || 0,
                        "Future projections",
                        <TrendingUp className="size-4" aria-hidden="true" />,
                        "Projected",
                        true,
                        <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                      )}
                      {renderSectionCard(
                        "Files Processed",
                        data.revenue.pipeline_run?.files_processed?.length || 0,
                        "Data sources",
                        <FileCheck className="size-4" aria-hidden="true" />,
                        "CSV Files",
                        false,
                        <FileText className="h-3 w-3 mr-1" aria-hidden="true" />
                      )}
                    </>
                  )}
                  {data.ebitda && (
                    <>
                      {renderSectionCard(
                        "Total EBIT",
                        data.ebitda.summary?.total_ebit || 0,
                        "Earnings analysis",
                        <Calculator className="size-4" aria-hidden="true" />,
                        "Calculated",
                        true,
                        <Calculator className="h-3 w-3 mr-1" aria-hidden="true" />
                      )}
                      {renderSectionCard(
                        "SDE",
                        (data.ebitda.summary?.total_ebit || 0) + 175000,
                        "Seller's Discretionary Earnings",
                        <Calculator className="size-4" aria-hidden="true" />,
                        "$175,000",
                        true,
                        <Plus className="h-3 w-3 mr-1" aria-hidden="true" />
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* SDE Calculation Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">SDE Calculation Note</h3>
                <p className="text-sm text-blue-800">
                  <strong>Seller's Discretionary Earnings (SDE)</strong> is calculated by adding the estimated owner salary/benefits ($175,000) to the EBIT figure. 
                  This represents the total cash flow available to a new owner, as they can take out the owner salary that was previously paid to the seller.
                </p>
                <p className="text-xs text-blue-700 mt-2">
                  Formula: SDE = EBIT + Owner Salary ($175,000)
                </p>
              </div>

              {/* Revenue Pipeline Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Revenue Pipeline</h2>
                {renderJsonSection("Revenue Pipeline Data", data.revenue, 'revenue')}
                {renderRevenueFilesTable()}
                {renderRevenueCalculationDetails()}
              </div>
              
              {/* EBIT Pipeline Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">EBIT Pipeline</h2>
                {renderJsonSection("EBIT Pipeline Data", data.ebitda, 'ebitda')}
                {renderEBITDAFilesTable()}
                {renderCalculationSteps()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader title="Admin Dashboard" />
        <AdminPageContent />
      </SidebarInset>
    </SidebarProvider>
  )
}
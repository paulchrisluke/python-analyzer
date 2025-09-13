"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"

// Type definitions
interface RevenueDataPoint {
  date: string
  year: string
  month: string
  revenue: number
  data_type: "historical" | "projected"
  file: string
  structure_type: string
}


// Robust date parsing utility for YYYY-MM format
function parseYearMonthString(dateString: string): Date | null {
  if (!dateString || typeof dateString !== 'string') {
    return null
  }
  
  const parts = dateString.split('-')
  if (parts.length !== 2) {
    return null
  }
  
  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  
  // Validate year and month
  if (isNaN(year) || isNaN(month) || year < 1900 || year > 2100 || month < 1 || month > 12) {
    return null
  }
  
  // Create date with month - 1 (JavaScript months are 0-indexed)
  return new Date(year, month - 1)
}

// Safe date formatter that handles invalid dates gracefully
function formatDateSafely(dateString: string, options: Intl.DateTimeFormatOptions): string {
  const date = parseYearMonthString(dateString)
  if (!date || isNaN(date.getTime())) {
    return dateString // Return original string as fallback
  }
  return date.toLocaleDateString("en-US", options)
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

// Types for revenue data

interface RevenueAuditTrail {
  pipeline_run: {
    graph_data: {
      monthly_data: RevenueDataPoint[]
    }
  }
}

// Cache key for localStorage
const REVENUE_DATA_CACHE_KEY = 'revenue_data_cache'
const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

// Sleep utility for retry delays
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Load cached data from localStorage
function loadCachedData(): RevenueDataPoint[] | null {
  try {
    const cached = localStorage.getItem(REVENUE_DATA_CACHE_KEY)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()
    
    // Check if cache is still valid
    if (now - timestamp > CACHE_EXPIRY_MS) {
      localStorage.removeItem(REVENUE_DATA_CACHE_KEY)
      return null
    }
    
    return data
  } catch (error) {
    console.warn('Failed to load cached revenue data:', error)
    localStorage.removeItem(REVENUE_DATA_CACHE_KEY)
    return null
  }
}

// Save data to cache
function saveToCache(data: RevenueDataPoint[]): void {
  try {
    const cacheData = {
      data,
      timestamp: Date.now()
    }
    localStorage.setItem(REVENUE_DATA_CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    console.warn('Failed to cache revenue data:', error)
  }
}

// Load revenue data from the audit trail with retry logic and cache fallback
async function loadRevenueData(signal?: AbortSignal): Promise<RevenueDataPoint[]> {
  const maxRetries = 3
  const baseDelay = 1000 // 1 second
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch('/data/revenue_audit_trail.json', { signal })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data: RevenueAuditTrail = await response.json()
      const revenueData = data.pipeline_run.graph_data.monthly_data
      
      // Save to cache on successful fetch
      saveToCache(revenueData)
      
      return revenueData
    } catch (error) {
      console.error(`Attempt ${attempt} failed to load revenue data:`, error)
      
      // If this is the last attempt, try cache fallback before failing
      if (attempt === maxRetries) {
        const cachedData = loadCachedData()
        if (cachedData) {
          console.warn('Using cached revenue data due to network failure')
          return cachedData
        }
        
        // No cache available, throw the error
        throw new Error(`Failed to load revenue data after ${maxRetries} attempts. ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
      
      // Wait with exponential backoff before retry
      const delay = baseDelay * Math.pow(2, attempt - 1)
      await sleep(delay)
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw new Error('Unexpected error in loadRevenueData')
}

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  projected_revenue: {
    label: "Projected Revenue",
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function FinancialChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("all")
  const [revenueData, setRevenueData] = React.useState<RevenueDataPoint[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isRetrying, setIsRetrying] = React.useState(false)

  // Load revenue data function that can be called on mount or retry
  const loadData = React.useCallback(async () => {
    try {
      setError(null)
      setLoading(true)
      setIsRetrying(false)
      
      const data = await loadRevenueData()
      setRevenueData(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load revenue data'
      setError(errorMessage)
      console.error('Failed to load revenue data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Retry function for user-initiated retry
  const handleRetry = React.useCallback(async () => {
    setIsRetrying(true)
    await loadData()
  }, [loadData])

  // Load revenue data on component mount
  React.useEffect(() => {
    const abortController = new AbortController()
    let isMounted = true

    const loadDataWithCleanup = async () => {
      try {
        setError(null)
        setLoading(true)
        setIsRetrying(false)
        
        const data = await loadRevenueData(abortController.signal)
        
        // Only update state if component is still mounted
        if (isMounted && !abortController.signal.aborted) {
          setRevenueData(data)
        }
      } catch (err) {
        // Only update state if component is still mounted
        if (isMounted && !abortController.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load revenue data'
          setError(errorMessage)
          console.error('Failed to load revenue data:', err)
        }
      } finally {
        // Always set loading to false if component is still mounted
        if (isMounted && !abortController.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadDataWithCleanup()

    // Cleanup function
    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("all")
    }
  }, [isMobile])

  // Transform revenue data for chart
  const chartData = React.useMemo(() => {
    if (!revenueData.length) return []

    const transformed = revenueData.map((item, index) => ({
      month: `${item.year}-${String(item.month || 1).padStart(2, '0')}`,
      revenue: item.data_type === "historical" ? item.revenue : null,
      projected_revenue: item.data_type === "projected" ? item.revenue : null,
      data_type: item.data_type,
      date: item.date,
      index: index
    }))

    // Debug: Log projected data to see if variation is present
    const projectedData = transformed.filter(item => item.data_type === "projected")
    if (projectedData.length > 0 && process.env.NODE_ENV === "development") {
      console.log("Projected data for chart:", projectedData.slice(0, 5).map(item => ({
        month: item.month,
        revenue: item.revenue,
        projected_revenue: item.projected_revenue
      })))
      console.log("First projected revenue value:", projectedData[0]?.projected_revenue)
      console.log("Second projected revenue value:", projectedData[1]?.projected_revenue)
    }

    // Find the transition point and add a bridge point
    const transitionIndex = transformed.findIndex(item => item.data_type === "projected")
    if (transitionIndex > 0) {
      const lastHistorical = transformed[transitionIndex - 1]
      const firstProjected = transformed[transitionIndex]
      
      // Add a bridge point that has both values to connect the lines
      const bridgePoint = {
        ...lastHistorical,
        revenue: lastHistorical.revenue,
        projected_revenue: firstProjected.projected_revenue,
        isBridge: true
      }
      
      // Insert the bridge point
      transformed.splice(transitionIndex, 0, bridgePoint)
    }

    return transformed
  }, [revenueData])

  const filteredData = React.useMemo(() => {
    if (timeRange === "all") return chartData
    
    const now = new Date()
    const cutoffDate = new Date()
    
    switch (timeRange) {
      case "12m":
        cutoffDate.setMonth(now.getMonth() - 12)
        break
      case "6m":
        cutoffDate.setMonth(now.getMonth() - 6)
        break
      case "3m":
        cutoffDate.setMonth(now.getMonth() - 3)
        break
      default:
        return chartData
    }
    
    return chartData.filter(item => {
      // Validate that item.date exists and is not null/undefined
      if (!item.date) {
        console.warn('Financial chart: Item missing date field', item)
        return false
      }
      
      // Create date and validate it's a valid date
      const itemDate = new Date(item.date)
      if (isNaN(itemDate.getTime())) {
        console.warn('Financial chart: Invalid date value', { date: item.date, item })
        return false
      }
      
      return itemDate >= cutoffDate
    })
  }, [chartData, timeRange])

  if (loading) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Financial Performance</CardTitle>
          <CardDescription>
            {isRetrying ? 'Retrying...' : 'Loading revenue data...'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex items-center justify-center h-[300px]">
            <div className="text-muted-foreground">
              {isRetrying ? 'Retrying...' : 'Loading...'}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="@container/card">
        <CardHeader>
          <CardTitle>Financial Performance</CardTitle>
          <CardDescription>Unable to load revenue data</CardDescription>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          <div className="flex flex-col items-center justify-center h-[300px] gap-4">
            <div className="text-center">
              <div className="text-destructive font-medium mb-2">Failed to load data</div>
              <div className="text-muted-foreground text-sm max-w-md">
                {error}
              </div>
            </div>
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isRetrying ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Revenue Performance</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Historical and projected revenue trends
          </span>
          <span className="@[540px]/card:hidden">Revenue trends</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="all" className="h-8 px-2.5">
              All Time
            </ToggleGroupItem>
            <ToggleGroupItem value="12m" className="h-8 px-2.5">
              Last 12 months
            </ToggleGroupItem>
            <ToggleGroupItem value="6m" className="h-8 px-2.5">
              Last 6 months
            </ToggleGroupItem>
            <ToggleGroupItem value="3m" className="h-8 px-2.5">
              Last 3 months
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="@[767px]/card:hidden flex w-40"
              aria-label="Select time range"
            >
              <SelectValue placeholder="All Time" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="rounded-lg">
                All Time
              </SelectItem>
              <SelectItem value="12m" className="rounded-lg">
                Last 12 months
              </SelectItem>
              <SelectItem value="6m" className="rounded-lg">
                Last 6 months
              </SelectItem>
              <SelectItem value="3m" className="rounded-lg">
                Last 3 months
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[300px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-projected_revenue)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--color-projected_revenue)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                return formatDateSafely(value, {
                  month: "short",
                  year: "2-digit",
                })
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return formatDateSafely(value as string, {
                      month: "long",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name, props: any) => {
                    if (value === null || value === undefined) return [null, null]
                    const label = name === "projected_revenue" ? "Projected Revenue" : "Historical Revenue"
                    return [
                      `$${Number(value).toLocaleString()}`,
                      label,
                    ]
                  }}
                  indicator="dot"
                />
              }
            />
            {/* Historical Revenue Area */}
            <Area
              dataKey="revenue"
              type="natural"
              stroke="var(--color-revenue)"
              fill="url(#historicalGradient)"
              strokeWidth={2}
              connectNulls={false}
            />
            {/* Projected Revenue Area */}
            <Area
              dataKey="projected_revenue"
              type="natural"
              stroke="var(--color-projected_revenue)"
              fill="url(#projectedGradient)"
              strokeWidth={2}
              strokeDasharray="5 5"
              connectNulls={false}
            />
          </AreaChart>
        </ChartContainer>
        
        {/* Legend */}
        <div className="flex items-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsl(var(--chart-1))' }}></div>
            <span className="text-muted-foreground">Historical Revenue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full border-2 border-dashed" style={{ borderColor: 'hsl(var(--chart-2))' }}></div>
            <span className="text-muted-foreground">Projected Revenue</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
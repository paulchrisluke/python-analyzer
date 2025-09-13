"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useIsMobile } from "@/hooks/use-mobile"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Types for yearly revenue data
interface YearlyRevenueData {
  year: string
  revenue: number
  data_type: "historical" | "projected"
}

interface YearlyRevenueAuditTrail {
  pipeline_run: {
    graph_data: {
      yearly_totals: {
        historical: Record<string, {
          total_revenue: number
          months: number
          monthly_average: number
        }>
        projected: Record<string, {
          months: number
          monthly_average: number
        }>
      }
    }
  }
}

const chartConfig = {
  revenue: {
    label: "Historical Revenue",
    color: "hsl(var(--chart-1))",
  },
  projected_revenue: {
    label: "Projected Revenue", 
    color: "hsl(var(--chart-2))",
  },
} satisfies ChartConfig

export function YearlyRevenueChart() {
  const isMobile = useIsMobile()
  const [revenueData, setRevenueData] = React.useState<YearlyRevenueData[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // Load and transform yearly revenue data
  React.useEffect(() => {
    const loadYearlyData = async () => {
      try {
        setError(null)
        setLoading(true)
        
        const response = await fetch('/data/revenue_audit_trail.json')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data: YearlyRevenueAuditTrail = await response.json()
        const yearlyTotals = data.pipeline_run.graph_data.yearly_totals
        
        // Transform data for stacked bars
        const allData: YearlyRevenueData[] = []
        
        // Add historical years
        Object.entries(yearlyTotals.historical).forEach(([year, data]) => {
          allData.push({
            year,
            revenue: data.total_revenue,
            data_type: "historical" as const
          })
        })
        
        // Add 2025 projected (remaining months) - this will stack on top of 2025 historical
        if (yearlyTotals.projected["2025_remaining"]) {
          const remaining2025 = yearlyTotals.projected["2025_remaining"]
          const projected2025Revenue = remaining2025.months * remaining2025.monthly_average
          allData.push({
            year: "2025",
            revenue: projected2025Revenue,
            data_type: "projected" as const
          })
        }
        
        // Add 2026 projected
        if (yearlyTotals.projected["2026"]) {
          const projected2026 = yearlyTotals.projected["2026"]
          const projected2026Revenue = projected2026.months * projected2026.monthly_average
          allData.push({
            year: "2026",
            revenue: projected2026Revenue,
            data_type: "projected" as const
          })
        }
        
        // Sort by year
        allData.sort((a, b) => {
          const yearA = parseInt(a.year)
          const yearB = parseInt(b.year)
          return yearA - yearB
        })
        
        setRevenueData(allData)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load revenue data'
        setError(errorMessage)
        console.error('Failed to load yearly revenue data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadYearlyData()
  }, [])

  // Transform data for chart - group by year for stacking
  const chartData = React.useMemo(() => {
    const groupedData = revenueData.reduce((acc, item) => {
      if (!acc[item.year]) {
        acc[item.year] = {
          year: item.year,
          revenue: 0,
          projected_revenue: 0,
        }
      }
      
      if (item.data_type === "historical") {
        acc[item.year].revenue = item.revenue
      } else if (item.data_type === "projected") {
        acc[item.year].projected_revenue = item.revenue
      }
      
      return acc
    }, {} as Record<string, { year: string; revenue: number; projected_revenue: number }>)
    
    return Object.values(groupedData).sort((a, b) => parseInt(a.year) - parseInt(b.year))
  }, [revenueData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Performance</CardTitle>
          <CardDescription>Annual revenue trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading revenue data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Revenue Performance</CardTitle>
          <CardDescription>Annual revenue trends</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-destructive">Error loading revenue data: {error}</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Performance</CardTitle>
        <CardDescription>Annual revenue trends</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="revenue"
              stackId="a"
              fill="var(--color-revenue)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="projected_revenue"
              stackId="a"
              fill="var(--color-projected_revenue)"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

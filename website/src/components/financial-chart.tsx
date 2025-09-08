"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
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

// Sample financial data - in real app this would come from ETL data
const financialData = [
  { month: "2023-01", revenue: 65000, expenses: 45000, profit: 20000 },
  { month: "2023-02", revenue: 72000, expenses: 48000, profit: 24000 },
  { month: "2023-03", revenue: 68000, expenses: 46000, profit: 22000 },
  { month: "2023-04", revenue: 75000, expenses: 50000, profit: 25000 },
  { month: "2023-05", revenue: 82000, expenses: 52000, profit: 30000 },
  { month: "2023-06", revenue: 78000, expenses: 49000, profit: 29000 },
  { month: "2023-07", revenue: 85000, expenses: 54000, profit: 31000 },
  { month: "2023-08", revenue: 88000, expenses: 55000, profit: 33000 },
  { month: "2023-09", revenue: 92000, expenses: 58000, profit: 34000 },
  { month: "2023-10", revenue: 87000, expenses: 53000, profit: 34000 },
  { month: "2023-11", revenue: 95000, expenses: 59000, profit: 36000 },
  { month: "2023-12", revenue: 98000, expenses: 60000, profit: 38000 },
  { month: "2024-01", revenue: 102000, expenses: 62000, profit: 40000 },
  { month: "2024-02", revenue: 105000, expenses: 64000, profit: 41000 },
  { month: "2024-03", revenue: 108000, expenses: 66000, profit: 42000 },
  { month: "2024-04", revenue: 112000, expenses: 68000, profit: 44000 },
  { month: "2024-05", revenue: 115000, expenses: 70000, profit: 45000 },
  { month: "2024-06", revenue: 118000, expenses: 72000, profit: 46000 },
]

const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))",
  },
  expenses: {
    label: "Expenses", 
    color: "hsl(var(--chart-2))",
  },
  profit: {
    label: "Profit",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

export function FinancialChart() {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("12m")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("6m")
    }
  }, [isMobile])

  const filteredData = financialData.filter((item, index) => {
    if (timeRange === "12m") return index >= 6 // Last 12 months
    if (timeRange === "6m") return index >= 12 // Last 6 months
    if (timeRange === "3m") return index >= 15 // Last 3 months
    return true
  })

  return (
    <Card className="@container/card">
      <CardHeader className="relative">
        <CardTitle>Financial Performance</CardTitle>
        <CardDescription>
          <span className="@[540px]/card:block hidden">
            Revenue, expenses, and profit trends
          </span>
          <span className="@[540px]/card:hidden">Financial trends</span>
        </CardDescription>
        <div className="absolute right-4 top-4">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
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
              <SelectValue placeholder="Last 12 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
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
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-revenue)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-expenses)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillProfit" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-profit)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-profit)"
                  stopOpacity={0.1}
                />
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
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
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
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  }}
                  formatter={(value, name) => [
                    `$${Number(value).toLocaleString()}`,
                    chartConfig[name as keyof typeof chartConfig]?.label || name,
                  ]}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="revenue"
              type="natural"
              fill="url(#fillRevenue)"
              stroke="var(--color-revenue)"
              strokeWidth={2}
            />
            <Area
              dataKey="expenses"
              type="natural"
              fill="url(#fillExpenses)"
              stroke="var(--color-expenses)"
              strokeWidth={2}
            />
            <Area
              dataKey="profit"
              type="natural"
              fill="url(#fillProfit)"
              stroke="var(--color-profit)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

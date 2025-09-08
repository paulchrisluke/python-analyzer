import { IconTrendingDown, IconTrendingUp, IconCurrencyDollar, IconCash, IconChartLine, IconTrendingUp2, IconPackage, IconShield, IconBuilding, IconTarget } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
// Client-safe formatting functions
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

interface SectionCardsProps {
  data?: {
    businessMetrics: {
      askingPrice: number;
      annualEbitda: number;
      annualRevenue: number;
      ebitdaMargin: number;
    };
  };
}

export function SectionCards({ data }: SectionCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription>Asking Price</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data ? formatCurrency(data.businessMetrics.askingPrice) : "$650,000"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              Below Market
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            All-inclusive price <IconPackage className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Equipment & locations included
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription>Cash Flow (SDE)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data ? formatCurrency(data.businessMetrics.annualEbitda) : "$260,403"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              Strong
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Consistent cash flow <IconShield className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Insurance-based revenue
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription>Gross Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data ? formatCurrency(data.businessMetrics.annualRevenue) : "$932,533"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              Growing
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Annual revenue <IconBuilding className="size-4" />
          </div>
          <div className="text-muted-foreground">30-month track record</div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription>EBITDA</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data ? formatCurrency(data.businessMetrics.annualEbitda) : "$260,403"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              {data ? formatPercentage(data.businessMetrics.ebitdaMargin) : "27.9%"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Strong profitability <IconTarget className="size-4" />
          </div>
          <div className="text-muted-foreground">Industry-leading margins</div>
        </CardFooter>
      </Card>
    </div>
  )
}

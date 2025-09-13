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
import { formatCurrency } from "@/lib/format"

function formatPercentage(value: number): string {
  // Guard against non-finite inputs
  if (!isFinite(value) || value === null || value === undefined) {
    return "0.0%";
  }
  
  // Detect if the value is a ratio (absolute value <= 1) and convert to percentage
  const normalizedValue = Math.abs(value) <= 1 ? value * 100 : value;
  
  return `${normalizedValue.toFixed(1)}%`;
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
          <CardDescription>Annual Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data ? formatCurrency(data.businessMetrics.annualRevenue) : "$2,470,115"}
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
            Total revenue <IconBuilding className="size-4" />
          </div>
          <div className="text-muted-foreground">30-month track record</div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription>Cash Flow (EBITDA)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {data ? formatCurrency(data.businessMetrics.annualEbitda) : "$664,245"}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              {data ? formatPercentage(data.businessMetrics.ebitdaMargin) : "26.9%"}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Consistent cash flow <IconShield className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Before interest, taxes, depreciation
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card bg-gradient-to-t from-primary/5 to-card shadow-xs">
        <CardHeader>
          <CardDescription>Equipment Value</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            $61,728
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-xs">
              <IconTrendingUp className="h-3 w-3 mr-1" />
              Included
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Professional equipment <IconPackage className="size-4" />
          </div>
          <div className="text-muted-foreground">State-of-the-art audiometers & tools</div>
        </CardFooter>
      </Card>
    </div>
  )
}

import { BusinessMetrics as BusinessMetricsType, formatPercentage } from "@/lib/etl-data";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, Target, Wrench } from "lucide-react";

interface BusinessMetricsProps {
  data: BusinessMetricsType;
}

export function BusinessMetrics({ data }: BusinessMetricsProps) {
  console.log("📈 BusinessMetrics rendering");
  
  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.annualRevenue * 2.5), // 30 months of data (2.5×)
      description: "2023-2025 Q2 Performance",
      icon: TrendingUp
    },
    {
      title: "Annual EBITDA",
      value: formatCurrency(data.annualRevenue * (data.ebitdaMargin / 100)),
      description: "Projected Annual",
      icon: DollarSign
    },
    {
      title: "ROI",
      value: formatPercentage(data.roi),
      description: "Annual Return",
      icon: Target
    },
    {
      title: "Equipment Value",
      value: formatCurrency(data.equipmentValue),
      description: "Included in Sale",
      icon: Wrench
    }
  ];

  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">
              Verified Financial Performance
            </CardTitle>
            <CardDescription className="text-lg">
              30 Months of Verified Financial Data
            </CardDescription>
            <CardDescription className="text-sm">
              Recession-Resistant Healthcare Business
            </CardDescription>
            <CardDescription className="text-sm text-destructive font-semibold">
              {formatCurrency(data.marketValue - data.askingPrice)} Below Market Value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metrics.map((metric, index) => {
                const IconComponent = metric.icon;
                return (
                  <Card key={index}>
                    <CardHeader>
                      <IconComponent className="h-8 w-8 text-primary mb-3" />
                      <CardTitle className="text-2xl font-bold">
                        {metric.value}
                      </CardTitle>
                      <CardDescription className="text-sm font-semibold">
                        {metric.title}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        {metric.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Valuation Multiples */}
        <Card className="mt-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Valuation Multiples
            </CardTitle>
            <CardDescription>
              Industry-standard valuation metrics for audiology practices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">
                    {(() => {
                      const safeMultiple = (Number.isFinite(data.askingPrice) && Number.isFinite(data.annualRevenue) && data.annualRevenue !== 0) 
                        ? (data.askingPrice / data.annualRevenue) 
                        : null;
                      return safeMultiple != null ? `${safeMultiple.toFixed(1)}x` : '-';
                    })()}
                  </CardTitle>
                  <CardDescription className="text-lg font-semibold">Revenue Multiple</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">
                    {formatCurrency(data.askingPrice)} ÷ {formatCurrency(data.annualRevenue)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Industry range: 0.8x - 1.2x annual revenue
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-3xl font-bold text-primary">
                    {(() => {
                      const annualEbitda = data.annualRevenue * (data.ebitdaMargin / 100);
                      const safeMultiple = (Number.isFinite(data.askingPrice) && Number.isFinite(annualEbitda) && annualEbitda !== 0) 
                        ? (data.askingPrice / annualEbitda) 
                        : null;
                      return safeMultiple != null ? `${safeMultiple.toFixed(1)}x` : '-';
                    })()}
                  </CardTitle>
                  <CardDescription className="text-lg font-semibold">EBITDA Multiple</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-1">
                    {formatCurrency(data.askingPrice)} ÷ {formatCurrency(data.annualRevenue * (data.ebitdaMargin / 100))}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Industry range: 3.0x - 5.0x annual EBITDA
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardDescription className="text-lg font-semibold">Our Price</CardDescription>
                  <CardTitle className="text-2xl font-bold text-primary">
                    {formatCurrency(data.askingPrice)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">All-inclusive package</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardDescription className="text-lg font-semibold">Market Value</CardDescription>
                  <CardTitle className="text-2xl font-bold text-primary">
                    {formatCurrency(data.marketValue)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Industry standard</p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


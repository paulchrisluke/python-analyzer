import { loadETLData, formatCurrency, formatPercentage } from "@/lib/etl-data";
import { BusinessMetrics } from "@/components/business-metrics";
import { EquipmentShowcase } from "@/components/equipment-showcase";
import { InvestmentHighlights } from "@/components/investment-highlights";
// import { CallToAction } from "@/components/call-to-action";
import { FinancialChart } from "@/components/financial-chart";
import { BusinessDetails } from "@/components/business-details";
import { DocumentsTable } from "@/components/documents-table";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUpIcon, Building2Icon } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

export default async function HomePage() {
  const etlData = await loadETLData();
  
  console.log("🏠 HomePage rendering - etlData:", etlData);
  console.log("🏠 HomePage rendering - components being rendered");
  
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Header matching dashboard */}
        <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
          <div className="flex w-full items-center justify-between gap-1 px-4 lg:gap-2 lg:px-6">
            <h1 className="text-base font-medium">Business Sale Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <TrendingUpIcon className="h-4 w-4 mr-1" />
                Quick Create
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content matching dashboard structure */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* Hero Section */}
              <div className="px-4 lg:px-6">
                <div className="text-center mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Exclusive Business Sale Opportunity
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Established Multi-Location Audiology Practice
                  </p>
                </div>
              </div>

              {/* Key Metrics Cards - exact same styling as dashboard */}
              <div className="*:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card lg:px-6">
                <Card className="@container/card">
                  <CardHeader className="relative">
                    <CardDescription>Annual Revenue</CardDescription>
                    <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                      {formatCurrency(etlData.businessMetrics.annualRevenue)}
                    </CardTitle>
                    <div className="absolute right-4 top-4">
                      <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                        <TrendingUpIcon className="size-3" />
                        +45%
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Strong revenue growth <TrendingUpIcon className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                      30-month track record
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader className="relative">
                    <CardDescription>EBITDA Margin</CardDescription>
                    <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                      {formatPercentage(etlData.businessMetrics.ebitdaMargin)}
                    </CardTitle>
                    <div className="absolute right-4 top-4">
                      <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                        <TrendingUpIcon className="size-3" />
                        Excellent
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Industry-leading margins <TrendingUpIcon className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                      Strong profitability
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader className="relative">
                    <CardDescription>ROI Potential</CardDescription>
                    <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                      {formatPercentage(etlData.businessMetrics.roi)}
                    </CardTitle>
                    <div className="absolute right-4 top-4">
                      <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                        <TrendingUpIcon className="size-3" />
                        High ROI
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Exceptional return potential <TrendingUpIcon className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                      Fast payback period
                    </div>
                  </CardFooter>
                </Card>

                <Card className="@container/card">
                  <CardHeader className="relative">
                    <CardDescription>Equipment Value</CardDescription>
                    <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                      {formatCurrency(etlData.businessMetrics.equipmentValue)}
                    </CardTitle>
                    <div className="absolute right-4 top-4">
                      <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
                        <Building2Icon className="size-3" />
                        Included
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter className="flex-col items-start gap-1 text-sm">
                    <div className="line-clamp-1 flex gap-2 font-medium">
                      Professional equipment included <Building2Icon className="size-4" />
                    </div>
                    <div className="text-muted-foreground">
                      Turnkey operation
                    </div>
                  </CardFooter>
                </Card>
              </div>

              {/* Financial Performance Chart */}
              <div className="px-4 lg:px-6">
                <FinancialChart />
              </div>

              {/* Investment Opportunity Card */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Limited Time Opportunity</CardTitle>
                    <CardDescription className="text-lg">
                      Established business with {formatCurrency(etlData.businessMetrics.annualRevenue)} annual revenue + {formatCurrency(etlData.businessMetrics.equipmentValue)} equipment
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold mb-2">
                        {formatCurrency(etlData.businessMetrics.askingPrice)}
                      </div>
                      <div className="text-lg font-semibold mb-4">All-Inclusive Price</div>
                      <div className="text-sm text-muted-foreground mb-6">
                        {(() => {
                          const { askingPrice, marketValue } = etlData.businessMetrics;
                          if (!marketValue || marketValue === 0) {
                            return "—";
                          }
                          const percent = ((marketValue - askingPrice) / marketValue) * 100;
                          const formattedPercent = percent % 1 === 0 ? percent.toFixed(0) : percent.toFixed(1);
                          return `${formattedPercent}% Below Market Value`;
                        })()}
                      </div>
                      <Button size="lg" className="w-full md:w-auto">
                        View Due Diligence Documents
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Business Details */}
              <div className="px-4 lg:px-6">
                <BusinessDetails data={etlData} />
              </div>

              {/* Business Metrics */}
              <BusinessMetrics data={etlData.businessMetrics} />

              {/* Investment Highlights */}
              <InvestmentHighlights highlights={etlData.investmentHighlights} />

              {/* Equipment Showcase */}
              <EquipmentShowcase equipment={etlData.equipmentCategories} />

              {/* Documents Table */}
              <div className="px-4 lg:px-6">
                <DocumentsTable />
              </div>

              {/* Call to Action - Temporarily removed */}
              {/* <CallToAction askingPrice={etlData.businessMetrics.askingPrice} /> */}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


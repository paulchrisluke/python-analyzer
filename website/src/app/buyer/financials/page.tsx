"use client"

import { AdminOrBuyer } from "@/components/nextauth-guard"
import { signOut } from "next-auth/react"
import { FinancialChart } from "@/components/financial-chart"
import { YearlyRevenueChart } from "@/components/yearly-revenue-chart"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

function BuyerFinancialsContent() {
  // Removed old auth - using NextAuth now

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />

        {/* Main Content matching dashboard structure */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              
              {/* Header */}
              <div className="px-4 lg:px-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Financial Analysis</h1>
                    <p className="text-lg text-gray-600">Detailed financial metrics and projections for due diligence</p>
                  </div>
                  <Button onClick={() => signOut({ callbackUrl: "/login" })} variant="outline">
                    Sign Out
                  </Button>
                </div>
              </div>

              {/* Monthly Revenue Analysis */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Revenue Analysis</CardTitle>
                    <CardDescription>
                      Detailed monthly revenue trends and seasonal patterns
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FinancialChart />
                  </CardContent>
                </Card>
              </div>

              {/* Annual Revenue Trends */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Annual Revenue Trends</CardTitle>
                    <CardDescription>
                      Year-over-year revenue growth and projections
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <YearlyRevenueChart />
                  </CardContent>
                </Card>
              </div>

              {/* Key Financial Metrics */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Key Financial Metrics</CardTitle>
                    <CardDescription>
                      EBITDA, margins, and profitability analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">43%</div>
                        <div className="text-sm text-muted-foreground">EBITDA Margin</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">$650K</div>
                        <div className="text-sm text-muted-foreground">Asking Price</div>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">2</div>
                        <div className="text-sm text-muted-foreground">Locations</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cash Flow Analysis */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Cash Flow Analysis</CardTitle>
                    <CardDescription>
                      Monthly cash flow patterns and seasonal variations
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Detailed cash flow analysis and projections will be available here for authenticated buyers.
                      This includes monthly cash flow statements, seasonal patterns, and working capital requirements.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <SiteFooter />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function BuyerFinancials() {
  return (
    <AdminOrBuyer>
      <BuyerFinancialsContent />
    </AdminOrBuyer>
  )
}

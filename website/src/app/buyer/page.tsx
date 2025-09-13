'use client'

import { useAuth } from '@/lib/simple-auth'
import { AuthGuard } from '@/components/auth-guard'
import { AdminOrBuyer } from '@/components/role-guard'
import { FinancialChart } from '@/components/financial-chart'
import { BuyerLocationInformation } from '@/components/buyer-location-information'
import { InvestmentHighlights } from '@/components/investment-highlights'
import { BusinessDetails } from '@/components/business-details'
import { YearlyRevenueChart } from '@/components/yearly-revenue-chart'
import { DueDiligenceDocuments } from '@/components/due-diligence-documents'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { staticBusinessData } from '@/data/business-data'

function BuyerDashboardContent() {
  const { user, signOut } = useAuth()

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
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="mb-2 text-4xl font-bold text-gray-900">
                      Buyer Dashboard
                    </h1>
                    <p className="text-lg text-gray-600">
                      Welcome, {user?.name}! Detailed business information for
                      due diligence.
                    </p>
                  </div>
                  <Button onClick={signOut} variant="outline">
                    Sign Out
                  </Button>
                </div>
              </div>

              {/* Investment Highlights */}
              <div className="px-4 lg:px-6">
                <InvestmentHighlights data={staticBusinessData} />
              </div>

              {/* Business Details */}
              <div className="px-4 lg:px-6">
                <BusinessDetails data={staticBusinessData} />
              </div>

              {/* Financial Chart */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Revenue Analysis</CardTitle>
                    <CardDescription>
                      Monthly revenue trends and projections for comprehensive
                      due diligence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <YearlyRevenueChart />
                  </CardContent>
                </Card>
              </div>

              {/* Location Information */}
              <div className="px-4 lg:px-6">
                <BuyerLocationInformation data={staticBusinessData} />
              </div>

              {/* Due Diligence Documents */}
              <div className="px-4 lg:px-6">
                <DueDiligenceDocuments />
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

export default function BuyerDashboard() {
  return (
    <AuthGuard>
      <AdminOrBuyer>
        <BuyerDashboardContent />
      </AdminOrBuyer>
    </AuthGuard>
  )
}

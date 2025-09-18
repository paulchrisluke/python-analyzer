'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FinancialChart } from "@/components/financial-chart"
import { BuyerLocationInformation } from "@/components/buyer-location-information"
import { InvestmentHighlights } from "@/components/investment-highlights"
import { BusinessDetails } from "@/components/business-details"
import { YearlyRevenueChart } from "@/components/yearly-revenue-chart"
import { PublicDocuments } from "@/components/documents"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { staticBusinessData } from '@/data/business-data'
import { NDAStatusResponse } from '@/types/nda'

function BuyerDashboardContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [ndaStatus, setNdaStatus] = useState<NDAStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check NDA status
  useEffect(() => {
    const checkNDAStatus = async () => {
      if (status === 'loading') return

      if (!session) {
        router.push('/api/auth/signin')
        return
      }

      try {
        const response = await fetch('/api/nda/status')
        if (response.ok) {
          const data = await response.json()
          const ndaStatusData: NDAStatusResponse = data.data
          setNdaStatus(ndaStatusData)
          
          // If user hasn't signed NDA and isn't exempt, redirect to NDA page
          if (!ndaStatusData.isSigned && !ndaStatusData.isExempt) {
            router.push('/nda')
            return
          }
        }
      } catch (error) {
        console.error('Error checking NDA status:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkNDAStatus()
  }, [session, status, router])

  // Show loading while checking authentication and NDA status
  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated or NDA not signed
  if (!session || (!ndaStatus?.isSigned && !ndaStatus?.isExempt)) {
    return null // Will redirect
  }

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
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Buyer Dashboard</h1>
                  <p className="text-lg text-gray-600">Welcome, {session?.user?.name}! Detailed business information for due diligence.</p>
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
                <PublicDocuments />
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
  return <BuyerDashboardContent />
}

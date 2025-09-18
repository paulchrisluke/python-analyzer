'use client'

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { FinancialChart } from "@/components/financial-chart"
import { BuyerLocationInformation } from "@/components/buyer-location-information"
import { InvestmentHighlights } from "@/components/investment-highlights"
import { BusinessDetails } from "@/components/business-details"
import { Documents } from "@/components/documents"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HeroSection } from "@/components/hero-section"
import { BuyerAccountStatus } from "@/components/buyer-account-status"
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

        {/* Main Content matching sales page structure */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Hero Section with Account Status instead of Contact Form */}
              <div className="px-4 lg:px-6">
                <div className="text-left mb-8">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2">
                    Due Diligence Dashboard
                  </h1>
                  <p className="text-muted-foreground text-lg mb-6">
                    Welcome, {session?.user?.name}! Complete business information for your evaluation.
                  </p>
                  
                  {/* Side by side layout: Image and Account Status */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    {/* Left Column: Image and Gallery Grid */}
                    <div className="w-full space-y-6">
                      {/* Professional Practice Image */}
                      <div className="w-full">
                        <img 
                          src="https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/526ec4c5-d212-4c60-8fec-c52822c84700/public"
                          alt="Professional audiology practice interior showing modern exam room with equipment"
                          className="w-full h-auto rounded-lg shadow-lg object-cover"
                        />
                      </div>
                      
                      {/* 3x2 Gallery Grid */}
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          "51af2538-9921-4866-4aee-ba627c176c00", // Image 1
                          "a35e0610-e53b-47aa-10f9-a0fb4af93000", // Image 2
                          "2c0dfb90-4471-4a60-1103-111b1086c100", // Image 3
                          "d914038e-b062-44e5-6ec1-e1494d790300", // Image 4
                          "f408b92c-3e3a-4826-f63b-49763e913d00", // Image 5
                          "3700bc2f-a475-4034-dc0a-fadb5ec56a00", // Image 6
                        ].map((imageId, index) => (
                          <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden"
                          >
                            {imageId ? (
                              <img 
                                src={`https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/${imageId}/public`}
                                alt={`Gallery image ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <span className="text-gray-400 text-xs font-medium">
                                  {index + 1}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Right Column: Account Status instead of Contact Form */}
                    <div className="w-full">
                      <BuyerAccountStatus ndaStatus={ndaStatus} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Investment Highlights */}
              <div className="px-4 lg:px-6">
                <InvestmentHighlights />
              </div>

              {/* Business Details */}
              <div className="px-4 lg:px-6">
                <BusinessDetails data={staticBusinessData} />
              </div>

              {/* Financial Analysis */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Financial Analysis</CardTitle>
                    <CardDescription>
                      Comprehensive financial data and revenue trends for due diligence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FinancialChart />
                  </CardContent>
                </Card>
              </div>

              {/* Location Information */}
              <div className="px-4 lg:px-6">
                <BuyerLocationInformation data={staticBusinessData} />
              </div>

              {/* Due Diligence Documents */}
              <div className="px-4 lg:px-6">
                <Documents />
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

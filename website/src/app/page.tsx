import { ANCHORS } from '@/lib/anchors'
import { InvestmentHighlights } from '@/components/investment-highlights'
import { YearlyRevenueChart } from '@/components/yearly-revenue-chart'
import { BusinessDetails } from '@/components/business-details'
import { LocationInformation } from '@/components/location-information'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { HeroSection } from '@/components/hero-section'
import { Documents } from '@/components/documents'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/app-sidebar'
import { staticBusinessData } from '@/data/business-data'

export default function HomePage() {
  console.log('🏠 HomePage rendering - using hardcoded static data')

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />

        {/* Main Content matching dashboard structure */}
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {/* Hero Section */}
              <HeroSection
                title="Established Two-Location Audiology Practice Available"
                subtitle="Cranberry Township & Pittsburgh, PA (Butler & Allegheny Counties)"
                imageUrl="https://imagedelivery.net/Frxyb2_d_vGyiaXhS5xqCg/526ec4c5-d212-4c60-8fec-c52822c84700/public"
                imageAlt="Professional audiology practice interior showing modern exam room with equipment"
              />

              {/* Investment Highlights */}
              <div id={ANCHORS.INVESTMENT_HIGHLIGHTS} className="px-4 lg:px-6">
                <InvestmentHighlights />
              </div>

              {/* Business Details */}
              <div id={ANCHORS.BUSINESS_DETAILS} className="px-4 lg:px-6">
                <BusinessDetails data={staticBusinessData} />
              </div>

              {/* Financial Chart */}
              <div className="px-4 lg:px-6">
                <YearlyRevenueChart />
              </div>

              {/* Location Information */}
              <div id={ANCHORS.LOCATION_INFORMATION} className="px-4 lg:px-6">
                <LocationInformation data={staticBusinessData} />
              </div>

              {/* Due Diligence */}
              <div id={ANCHORS.DUE_DILIGENCE} className="px-4 lg:px-6">
                <Documents />
              </div>

              {/* Call to Action - Temporarily removed */}
              {/* <CallToAction askingPrice={etlData.businessMetrics.askingPrice} /> */}
            </div>
          </div>
        </div>

        {/* Footer */}
        <SiteFooter />
      </SidebarInset>
    </SidebarProvider>
  )
}

import { loadETLData, formatCurrency, formatPercentage } from "@/lib/etl-data";
import { BusinessMetrics } from "@/components/business-metrics";
import { InvestmentHighlights } from "@/components/investment-highlights";
// import { CallToAction } from "@/components/call-to-action";
import { FinancialChart } from "@/components/financial-chart";
import { BusinessDetails } from "@/components/business-details";
import { LocationInformation } from "@/components/location-information";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { HeroSection } from "@/components/hero-section";
import { DueDiligenceDocuments } from "@/components/due-diligence-documents";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
              <div id="investment-highlights" className="px-4 lg:px-6">
                <InvestmentHighlights />
              </div>

              {/* Business Details */}
              <div id="business-details" className="px-4 lg:px-6">
                <BusinessDetails data={etlData} />
              </div>

              {/* Due Diligence Documents */}
              <div id="due-diligence-documents" className="px-4 lg:px-6">
                <DueDiligenceDocuments />
              </div>

              {/* Location Information */}
              <div id="location-information" className="px-4 lg:px-6">
                <LocationInformation data={etlData} />
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
  );
}


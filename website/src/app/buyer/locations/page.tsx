"use client"

import { BuyerLocationInformation } from "@/components/buyer-location-information"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Static business data for buyer locations page (from business_rules.yaml)
const staticBusinessData = {
  property_details: {
    primary_location: {
      name: "Cranberry Hearing & Balance",
      address: "20820 Route 19, Suite A",
      city: "Cranberry Twp",
      state: "PA",
      zip_code: "16066",
      phone: "724-779-4444",
      google_maps_url: "https://www.google.com/maps/place/20820%20Route%2019+Cranberry%20Twp+PA+16066",
      location_type: "primary",
      for_sale: true,
    },
    secondary_location: {
      name: "Cranberry Hearing & Balance - West View",
      address: "999 West View Park Drive",
      city: "Pittsburgh",
      state: "PA", 
      zip_code: "15229",
      phone: "412-931-9290",
      google_maps_url: "https://www.google.com/maps/place/999%20West%20View%20Park%20Drive+Pittsburgh+PA+15229",
      location_type: "satellite",
      for_sale: true,
    },
    lease_analysis: {
      monthly_rent: 8500,
      annual_rent: 102000,
      monthly_cam: 1200,
      annual_cam: 14400,
      total_monthly_cost: 9700,
      total_annual_cost: 116400,
      cam_percentage: 14.1,
    },
    total_locations: 2,
    property_type: "Medical Office",
  },
};

function BuyerLocationsContent() {
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
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Location Details</h1>
                  <p className="text-lg text-gray-600">Detailed location information and property analysis</p>
                </div>
              </div>

              {/* Detailed Location Information */}
              <div className="px-4 lg:px-6">
                <BuyerLocationInformation data={staticBusinessData} />
              </div>

              {/* Market Analysis */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Market Analysis</CardTitle>
                    <CardDescription>
                      Local market conditions and competitive landscape
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Cranberry Township Market</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Growing suburban market with aging population</li>
                          <li>• Limited local competition in audiology services</li>
                          <li>• High visibility location on Route 19</li>
                          <li>• Established insurance relationships (UPMC, Aetna)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Pittsburgh Metro Market</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          <li>• Large metropolitan market with diverse demographics</li>
                          <li>• West View location serves North Hills area</li>
                          <li>• Strong referral network with local healthcare providers</li>
                          <li>• Established patient base with high retention rates</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Property Details */}
              <div className="px-4 lg:px-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Property Details</CardTitle>
                    <CardDescription>
                      Physical property characteristics and lease information
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Primary Location - Cranberry</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Property Type:</span>
                            <span>Medical Office</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Square Footage:</span>
                            <span>2,500 sq ft</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Parking:</span>
                            <span>10 spaces</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Accessibility:</span>
                            <span>ADA Compliant</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Secondary Location - West View</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Property Type:</span>
                            <span>Medical Office</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Square Footage:</span>
                            <span>2,200 sq ft</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Parking:</span>
                            <span>10 spaces</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Accessibility:</span>
                            <span>ADA Compliant</span>
                          </div>
                        </div>
                      </div>
                    </div>
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

export default function BuyerLocations() {
  return <BuyerLocationsContent />
}

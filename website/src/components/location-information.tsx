"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPinIcon, ExternalLinkIcon, Building2Icon } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface LocationInformationProps {
  data: {
    property_details?: {
      primary_location?: {
        name: string;
        address: string;
        city: string;
        state: string;
        zip_code: string;
        phone: string;
        google_maps_url?: string;
        location_type: string;
        for_sale: boolean;
      };
      secondary_location?: {
        name: string;
        address: string;
        city: string;
        state: string;
        zip_code: string;
        phone: string;
        google_maps_url?: string;
        location_type: string;
        for_sale: boolean;
      };
      lease_analysis?: {
        monthly_rent: number;
        annual_rent: number;
        monthly_cam: number;
        annual_cam: number;
        total_monthly_cost: number;
        total_annual_cost: number;
        cam_percentage: number;
      };
    };
  };
}


export function LocationInformation({ data }: LocationInformationProps) {
  const primaryLocation = data.property_details?.primary_location;
  const secondaryLocation = data.property_details?.secondary_location;
  const leaseAnalysis = data.property_details?.lease_analysis;

  // General Pennsylvania state map
  const generalPAMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3077942.9752484146!2d-77.60470459999999!3d41.1169783!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x882d80261e32e589%3A0xc24621475022b43d!2sPennsylvania%2C%20USA!5e0!3m2!1sen!2sth!4v1757773058944!5m2!1sen!2sth";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* General PA Map */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <MapPinIcon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-lg">Business Location</span>
            </div>
            <div className="space-y-3">
              <div className="font-medium space-y-1">
                <div>Two Strategic Locations</div>
                <div>Cranberry Township & Pittsburgh Metro Area, PA</div>
                <div className="text-sm text-muted-foreground">
                  Butler County & Allegheny County
                </div>
              </div>
              {/* General PA Map */}
              <div className="w-full h-64 rounded-lg overflow-hidden border">
                <iframe
                  src={generalPAMapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Map of Pennsylvania"
                />
              </div>
            </div>
          </div>

          {/* Two Column Grid for Location Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Location - Cranberry */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-lg">Primary Location</span>
              </div>
              <div className="space-y-3">
                <div className="font-medium space-y-1">
                  <div>Cranberry Hearing & Balance</div>
                  <div className="text-sm text-muted-foreground">
                    Cranberry Twp, PA 16066
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parking Spaces:</span>
                    <span className="font-medium">10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Staff:</span>
                    <span className="font-medium">2.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Square Footage:</span>
                    <span className="font-medium">2,500 sq ft</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Location - West View */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-lg">Secondary Location</span>
              </div>
              <div className="space-y-3">
                <div className="font-medium space-y-1">
                  <div>Cranberry Hearing & Balance - West View</div>
                  <div className="text-sm text-muted-foreground">
                    Pittsburgh, PA 15229
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Parking Spaces:</span>
                    <span className="font-medium">10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Staff:</span>
                    <span className="font-medium">2.5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Square Footage:</span>
                    <span className="font-medium">2,200 sq ft</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Property Information */}
          <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Building2Icon className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Property Information</span>
            </div>
            <div className="space-y-1">
              <div className="font-medium">
                Medical Office Space - Two Locations
              </div>
              <div className="text-sm text-muted-foreground">
                • Professional medical office facilities
                <br />
                • Favorable lease terms with established landlords
                <br />
                • Detailed lease analysis available to qualified buyers
                <br />
                • Total occupancy costs competitive for the market
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

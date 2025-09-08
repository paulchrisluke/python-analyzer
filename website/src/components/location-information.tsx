"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPinIcon, ExternalLinkIcon, Building2Icon } from "lucide-react";

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

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export function LocationInformation({ data }: LocationInformationProps) {
  const primaryLocation = data.property_details?.primary_location;
  const secondaryLocation = data.property_details?.secondary_location;
  const leaseAnalysis = data.property_details?.lease_analysis;

  // Google Maps embed URLs for the specific locations
  const primaryMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.094106487849!2d-80.10373489999999!3d40.715944799999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88347d60b359a0d1%3A0x582ff38053ba4f02!2s20820%20Rte%2019%2C%20Cranberry%20Twp%2C%20PA%2016066%2C%20USA!5e0!3m2!1sen!2sth!4v1757341276116!5m2!1sen!2sth";
  const secondaryMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3033.1426312153276!2d-80.0373879!3d40.516338399999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8834f4c5dac8f145%3A0x6d066d9d960e9078!2s999%20W%20View%20Park%20Dr%2C%20Pittsburgh%2C%20PA%2015229%2C%20USA!5e0!3m2!1sen!2sth!4v1757341304227!5m2!1sen!2sth";

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Two Column Grid for Locations */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Primary Location */}
            {primaryLocation && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-lg">Primary Location</span>
                </div>
                <div className="space-y-3">
                  <div className="font-medium space-y-1">
                    <div>{primaryLocation.address}</div>
                    <div>{primaryLocation.city}, {primaryLocation.state} {primaryLocation.zip_code}</div>
                  </div>
                  {/* Embedded Google Map */}
                  <div className="w-full h-64 rounded-lg overflow-hidden border">
                    <iframe
                      src={primaryMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Map of Primary Location - 20820 Route 19, Cranberry Twp, PA"
                    />
                  </div>
                  {primaryLocation.google_maps_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(primaryLocation.google_maps_url, '_blank')}
                    >
                      <ExternalLinkIcon className="h-3 w-3 mr-1" />
                      Open in Google Maps
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Secondary Location */}
            {secondaryLocation && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-lg">Secondary Location</span>
                </div>
                <div className="space-y-3">
                  <div className="font-medium space-y-1">
                    <div>{secondaryLocation.address}</div>
                    <div>{secondaryLocation.city}, {secondaryLocation.state} {secondaryLocation.zip_code}</div>
                  </div>
                  {/* Embedded Google Map */}
                  <div className="w-full h-64 rounded-lg overflow-hidden border">
                    <iframe
                      src={secondaryMapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Map of Secondary Location - 999 West View Park Drive, Pittsburgh, PA"
                    />
                  </div>
                  {secondaryLocation.google_maps_url && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(secondaryLocation.google_maps_url, '_blank')}
                    >
                      <ExternalLinkIcon className="h-3 w-3 mr-1" />
                      Open in Google Maps
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Monthly Rent Information */}
          {leaseAnalysis && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Monthly Rent Information</span>
              </div>
              <div className="space-y-1">
                <div className="font-medium">
                  {formatCurrency(leaseAnalysis.monthly_rent)} + {formatCurrency(leaseAnalysis.monthly_cam)} CAM
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Monthly Cost: {formatCurrency(leaseAnalysis.total_monthly_cost)}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

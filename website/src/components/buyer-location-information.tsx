"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPinIcon, ExternalLinkIcon, Building2Icon } from "lucide-react";

interface BuyerLocationInformationProps {
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

export function BuyerLocationInformation({ data }: BuyerLocationInformationProps) {
  const primaryLocation = data.property_details?.primary_location;
  const secondaryLocation = data.property_details?.secondary_location;
  const leaseAnalysis = data.property_details?.lease_analysis;

  // Google Maps embed URLs for the specific locations
  const primaryMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.094106487849!2d-80.10373489999999!3d40.715944799999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x88347d60b359a0d1%3A0x582ff38053ba4f02!2s20820%20Rte%2019%2C%20Cranberry%20Twp%2C%20PA%2016066%2C%20USA!5e0!3m2!1sen!2sth!4v1757341276116!5m2!1sen!2sth";
  const secondaryMapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3033.1426312153276!2d-80.0373879!3d40.516338399999995!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8834f4c5dac8f145%3A0x6d066d9d960e9078!2s999%20W%20View%20Park%20Dr%2C%20Pittsburgh%2C%20PA%2015229%2C%20USA!5e0!3m2!1sen!2sth!4v1757341304227!5m2!1sen!2sth";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detailed Location Information</CardTitle>
        <CardDescription>
          Specific addresses and detailed property information for due diligence
        </CardDescription>
      </CardHeader>
      <CardContent>
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
                    <div>{primaryLocation.name}</div>
                    <div>{primaryLocation.address}</div>
                    <div>{primaryLocation.city}, {primaryLocation.state} {primaryLocation.zip_code}</div>
                    <div className="text-sm text-muted-foreground">{primaryLocation.phone}</div>
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
                    <Button asChild variant="outline" size="sm">
                      <a 
                        href={primaryLocation.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className="h-3 w-3 mr-1" />
                        Open in Google Maps
                      </a>
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
                    <div>{secondaryLocation.name}</div>
                    <div>{secondaryLocation.address}</div>
                    <div>{secondaryLocation.city}, {secondaryLocation.state} {secondaryLocation.zip_code}</div>
                    <div className="text-sm text-muted-foreground">{secondaryLocation.phone}</div>
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
                    <Button asChild variant="outline" size="sm">
                      <a 
                        href={secondaryLocation.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLinkIcon className="h-3 w-3 mr-1" />
                        Open in Google Maps
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Lease Information */}
          {leaseAnalysis && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <Building2Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Detailed Lease Analysis</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Monthly Costs</div>
                  <div className="space-y-1 text-sm">
                    <div>Base Rent: {formatCurrency(leaseAnalysis.monthly_rent)}</div>
                    <div>CAM Charges: {formatCurrency(leaseAnalysis.monthly_cam)}</div>
                    <div className="font-medium">Total Monthly: {formatCurrency(leaseAnalysis.total_monthly_cost)}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Annual Costs</div>
                  <div className="space-y-1 text-sm">
                    <div>Base Rent: {formatCurrency(leaseAnalysis.annual_rent)}</div>
                    <div>CAM Charges: {formatCurrency(leaseAnalysis.annual_cam)}</div>
                    <div className="font-medium">Total Annual: {formatCurrency(leaseAnalysis.total_annual_cost)}</div>
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                CAM Percentage: {leaseAnalysis.cam_percentage}%
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

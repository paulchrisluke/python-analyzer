"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
    // Add location audit trail data for dynamic lease information
    location_audit_trail?: {
      cranberry_pa?: {
        summary?: {
          current_monthly_rent: number;
          lease_end_date: string;
        };
      };
      west_view_pa?: {
        summary?: {
          current_monthly_rent: number;
          lease_end_date: string;
        };
      };
    };
  };
}


export function LocationInformation({ data }: LocationInformationProps) {
  const primaryLocation = data.property_details?.primary_location;
  const secondaryLocation = data.property_details?.secondary_location;
  const leaseAnalysis = data.property_details?.lease_analysis;
  const locationAuditTrail = data.location_audit_trail;

  // Helper function to format lease end date
  const formatLeaseEndDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'N/A';
    }
  };

  // Helper function to format monthly rent with CAM info
  const formatMonthlyRent = (rent: number | undefined, camFee?: number): string => {
    if (rent === undefined || rent === null) return 'N/A';
    const formattedRent = formatCurrency(rent);
    const camText = camFee && camFee > 0 ? ` + ${formatCurrency(camFee)} CAM` : '';
    return `${formattedRent}${camText}`;
  };

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
                    <span className="font-medium">10 dedicated spaces</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Staff:</span>
                    <span className="font-medium">2 staff + shared accountant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Square Footage:</span>
                    <span className="font-medium">1,500 sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lease Expires:</span>
                    <span className="font-medium">
                      {formatLeaseEndDate(locationAuditTrail?.cranberry_pa?.summary?.lease_end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <span className="font-medium">
                      {formatMonthlyRent(locationAuditTrail?.cranberry_pa?.summary?.current_monthly_rent)}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Facility Features</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">3 Private Exam Rooms</Badge>
                    <Badge variant="outline" className="text-xs">Audiometric Testing Suite</Badge>
                    <Badge variant="outline" className="text-xs">Hearing Aid Lab</Badge>
                    <Badge variant="outline" className="text-xs">12-Seat Waiting Area</Badge>
                    <Badge variant="outline" className="text-xs">Admin Office</Badge>
                    <Badge variant="outline" className="text-xs">Equipment Storage</Badge>
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
                    <span className="font-medium">10 dedicated spaces</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Staff:</span>
                    <span className="font-medium">2 staff + shared accountant</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Square Footage:</span>
                    <span className="font-medium">1,500 sq ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Lease Expires:</span>
                    <span className="font-medium">
                      {formatLeaseEndDate(locationAuditTrail?.west_view_pa?.summary?.lease_end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <span className="font-medium">
                      {formatMonthlyRent(locationAuditTrail?.west_view_pa?.summary?.current_monthly_rent)}
                    </span>
                  </div>
                </div>
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Facility Features</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">2 Private Exam Rooms</Badge>
                    <Badge variant="outline" className="text-xs">Balance Testing Suite</Badge>
                    <Badge variant="outline" className="text-xs">Consultation Room</Badge>
                    <Badge variant="outline" className="text-xs">8-Seat Waiting Area</Badge>
                    <Badge variant="outline" className="text-xs">Admin Office</Badge>
                    <Badge variant="outline" className="text-xs">Equipment Storage</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}

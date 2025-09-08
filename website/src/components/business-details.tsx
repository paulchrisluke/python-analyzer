import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPinIcon, 
  Building2Icon, 
  UsersIcon, 
  CalendarIcon,
  DollarSignIcon,
  TrendingUpIcon,
  ClockIcon,
  FileTextIcon,
  CheckCircleIcon
} from "lucide-react";

interface BusinessDetailsProps {
  data: any;
}

export function BusinessDetails({ data }: BusinessDetailsProps) {
  return (
    <div className="space-y-6">
      {/* Business Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2Icon className="h-5 w-5" />
            Business Overview
          </CardTitle>
          <CardDescription>
            Comprehensive details about Cranberry Hearing & Balance Center
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Location:</span>
                <span>Pittsburgh, PA</span>
              </div>
              <div className="flex items-center gap-2">
                <Building2Icon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Business Type:</span>
                <span>Healthcare - Audiology Practice</span>
              </div>
              <div className="flex items-center gap-2">
                <UsersIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Employees:</span>
                <span>8-12 Full-time</span>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Established:</span>
                <span>2003 (22 years)</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Asking Price:</span>
                <span className="font-bold text-lg">$650,000</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Annual Revenue:</span>
                <span className="font-bold">$932,533</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">EBITDA Margin:</span>
                <span className="font-bold">27.9%</span>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Payback Period:</span>
                <span className="font-bold">2.5 years</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Financial Highlights
          </CardTitle>
          <CardDescription>
            Key financial metrics and performance indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-2xl font-bold">$932,533</div>
              <div className="text-sm text-muted-foreground">Annual Revenue</div>
              <Badge variant="outline" className="mt-2">
                <TrendingUpIcon className="h-3 w-3 mr-1" />
                +12% Growth
              </Badge>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-2xl font-bold">$260,403</div>
              <div className="text-sm text-muted-foreground">Annual EBITDA</div>
              <Badge variant="outline" className="mt-2">
                27.9% Margin
              </Badge>
            </div>
            <div className="text-center p-4 bg-card rounded-lg border">
              <div className="text-2xl font-bold">40.1%</div>
              <div className="text-sm text-muted-foreground">ROI Potential</div>
              <Badge variant="outline" className="mt-2">
                2.5 Year Payback
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Description */}
      <Card>
        <CardHeader>
          <CardTitle>Business Description</CardTitle>
          <CardDescription>
            Detailed overview of the audiology practice
          </CardDescription>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p className="mb-4">
            Cranberry Hearing & Balance Center is a well-established, multi-location audiology practice serving the Pittsburgh metropolitan area. Founded in 2003, the practice has built a strong reputation for providing comprehensive hearing healthcare services to patients of all ages.
          </p>
          <p className="mb-4">
            The business operates from multiple locations, offering a full range of audiological services including hearing evaluations, hearing aid fittings, balance assessments, and ongoing patient care. The practice has developed strong relationships with local healthcare providers and maintains a loyal patient base.
          </p>
          <p className="mb-4">
            <strong>Key Strengths:</strong>
          </p>
          <ul className="list-disc pl-6 mb-4">
            <li>22 years of established operations and community presence</li>
            <li>Multiple locations providing market coverage</li>
            <li>Strong referral network with local healthcare providers</li>
            <li>Comprehensive service offerings</li>
            <li>Experienced staff and established protocols</li>
            <li>Modern equipment and technology</li>
          </ul>
        </CardContent>
      </Card>

      {/* Due Diligence Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileTextIcon className="h-5 w-5" />
            Due Diligence Documents
          </CardTitle>
          <CardDescription>
            Available documentation for serious buyers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium">Financial Documents</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Profit & Loss Statements (2023-2024)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Balance Sheets (2022-2024)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>General Ledger (2021-2025)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Tax Returns (2021-2023)</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium">Operational Documents</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Equipment Inventory & Valuations</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Lease Agreements</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Insurance Policies</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
                  <span>Staff Information & Contracts</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-6">
            <Button className="w-full md:w-auto">
              <FileTextIcon className="h-4 w-4 mr-2" />
              Request Full Due Diligence Package
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

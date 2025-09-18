"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Calendar, Shield } from "lucide-react"
import { NDAStatusResponse } from "@/types/nda"

interface BuyerAccountStatusProps {
  ndaStatus: NDAStatusResponse | null
}

export function BuyerAccountStatus({ ndaStatus }: BuyerAccountStatusProps) {

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Card>
      <CardContent className="space-y-6 pt-6">

        {/* NDA Status */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
            NDA Status
          </h3>
          
          {ndaStatus?.isSigned ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200 mb-2">
                    NDA Signed
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    You have access to confidential business information
                  </p>
                </div>
              </div>
              
              {ndaStatus.signature && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {formatDate(ndaStatus.signature.signedAt)}
                      </p>
                      <p className="text-xs text-muted-foreground">Signed Date</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Shield className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {ndaStatus.signature.version || '1.0'}
                      </p>
                      <p className="text-xs text-muted-foreground">NDA Version</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : ndaStatus?.isExempt ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 mb-2">
                  Admin Access
                </Badge>
                <p className="text-sm text-muted-foreground">
                  You have administrative access to all information
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
              <div className="h-5 w-5 rounded-full border-2 border-amber-500 flex-shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <Badge variant="outline" className="border-amber-500 text-amber-700 mb-2">
                  NDA Required
                </Badge>
                <p className="text-sm text-muted-foreground">
                  Please sign the NDA to access confidential information
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Access Information */}
        <div>
          <h4 className="font-medium text-sm mb-3">What you can access:</h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>Complete financial statements and revenue data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>Detailed business operations and processes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>Location information and market analysis</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>Due diligence documents and reports</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-muted-foreground mt-1">•</span>
              <span>Equipment inventories and vendor relationships</span>
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

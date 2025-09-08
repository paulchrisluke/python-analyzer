import { InvestmentHighlights as InvestmentHighlightsType } from "@/lib/etl-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";

interface InvestmentHighlightsProps {
  highlights: InvestmentHighlightsType[];
}

export function InvestmentHighlights({ highlights }: InvestmentHighlightsProps) {
  console.log("💰 InvestmentHighlights rendering");
  
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Target className="h-8 w-8 text-primary" />
              Investment Highlights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {highlights.map((highlight, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                      {highlight.value}
                    </CardTitle>
                    <CardDescription className="text-lg font-semibold">
                      {highlight.metric}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-primary font-medium mb-2">
                      {highlight.comparison}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {highlight.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-12">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-4">Proven Revenue</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• $946,651 annual revenue projection</li>
                  <li>• Strong 45% EBITDA margin</li>
                  <li>• Healthcare industry: recession-resistant business</li>
                  <li>• Turnkey operation: complete infrastructure included</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4">Investment Value</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li>• Below market value: 29% discount from industry standard</li>
                  <li>• High ROI: 44.4% annual return potential</li>
                  <li>• Fast payback: 2.25 years</li>
                  <li>• Professional equipment included: $61,728 value</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


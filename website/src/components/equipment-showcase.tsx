import { EquipmentCategory } from "@/lib/etl-data";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, MapPin } from "lucide-react";

interface EquipmentShowcaseProps {
  equipment: EquipmentCategory[];
}

export function EquipmentShowcase({ equipment }: EquipmentShowcaseProps) {
  console.log("🔧 EquipmentShowcase rendering");
  
  return (
    <div className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold flex items-center gap-2">
              <Wrench className="h-8 w-8 text-primary" />
              Professional Equipment Included
            </CardTitle>
            <CardDescription className="text-lg">
              {formatCurrency(equipment.reduce((sum, cat) => sum + cat.value, 0))} in Professional Audiology Equipment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {equipment.map((category, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">
                      {formatCurrency(category.value)}
                    </CardTitle>
                    <CardDescription className="text-lg font-semibold">
                      {category.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {category.description}
                    </p>
                    <div className="space-y-1">
                      {category.items.map((item, itemIndex) => (
                        <p key={itemIndex} className="text-xs text-muted-foreground">
                          • {item}
                        </p>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Strategic Multi-Location Advantage */}
        <Card className="mt-16">
          <CardHeader>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              Strategic Multi-Location Advantage
            </CardTitle>
            <CardDescription>
              Two established locations serving key Pittsburgh markets
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Pittsburgh (West View)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Primary location with strong market presence
                  </p>
                  <p className="text-xs text-primary font-medium">
                    Established Market
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Cranberry Hearing & Balance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Secondary location with consistent revenue
                  </p>
                  <p className="text-xs text-primary font-medium">
                    Growth Market
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Diversified Revenue Streams:</strong> Multiple locations reduce risk and provide market expansion opportunities
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


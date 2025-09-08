import { EquipmentCategory, formatCurrency } from "@/lib/etl-data";

interface EquipmentShowcaseProps {
  equipment: EquipmentCategory[];
}

export function EquipmentShowcase({ equipment }: EquipmentShowcaseProps) {
  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Professional Equipment Included
          </h2>
          <p className="text-lg text-gray-600">
            {formatCurrency(equipment.reduce((sum, cat) => sum + cat.value, 0))} in Professional Audiology Equipment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {equipment.map((category, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {formatCurrency(category.value)}
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-3">
                  {category.category}
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  {category.description}
                </div>
                <div className="space-y-1">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="text-xs text-gray-500">
                      • {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Strategic Multi-Location Advantage */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Strategic Multi-Location Advantage
          </h3>
          <p className="text-center text-gray-600 mb-8">
            Two established locations serving key Pittsburgh markets
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg p-6">
              <div className="text-center">
                <div className="text-2xl mb-3">📍</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Pittsburgh (West View)
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Primary location with strong market presence
                </div>
                <div className="text-xs text-blue-600 font-medium">
                  Established Market
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-6">
              <div className="text-center">
                <div className="text-2xl mb-3">📍</div>
                <div className="text-lg font-semibold text-gray-900 mb-2">
                  Cranberry Hearing & Balance
                </div>
                <div className="text-sm text-gray-600 mb-4">
                  Secondary location with consistent revenue
                </div>
                <div className="text-xs text-green-600 font-medium">
                  Growth Market
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              <strong>Diversified Revenue Streams:</strong> Multiple locations reduce risk and provide market expansion opportunities
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


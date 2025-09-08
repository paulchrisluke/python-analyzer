import { InvestmentHighlights as InvestmentHighlightsType } from "@/lib/etl-data";

interface InvestmentHighlightsProps {
  highlights: InvestmentHighlightsType[];
}

export function InvestmentHighlights({ highlights }: InvestmentHighlightsProps) {
  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            🎯 Investment Highlights
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {highlights.map((highlight, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  {highlight.value}
                </div>
                <div className="text-lg font-semibold text-gray-700 mb-2">
                  {highlight.metric}
                </div>
                <div className="text-sm text-blue-600 font-medium mb-2">
                  {highlight.comparison}
                </div>
                <div className="text-sm text-gray-600">
                  {highlight.description}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-white rounded-lg p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Proven Revenue</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• $946,651 annual revenue projection</li>
                <li>• Strong 45% EBITDA margin</li>
                <li>• Healthcare industry: recession-resistant business</li>
                <li>• Turnkey operation: complete infrastructure included</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Investment Value</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Below market value: 29% discount from industry standard</li>
                <li>• High ROI: 44.4% annual return potential</li>
                <li>• Fast payback: 2.25 years</li>
                <li>• Professional equipment included: $61,728 value</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

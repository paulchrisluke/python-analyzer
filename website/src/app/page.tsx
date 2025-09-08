import { loadETLData, formatCurrency, formatPercentage } from "@/lib/etl-data";
import { BusinessMetrics } from "@/components/business-metrics";
import { InvestmentCalculator } from "@/components/investment-calculator";
import { EquipmentShowcase } from "@/components/equipment-showcase";
import { InvestmentHighlights } from "@/components/investment-highlights";
import { CallToAction } from "@/components/call-to-action";

export default async function HomePage() {
  const etlData = await loadETLData();
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">
              Cranberry
              <br />
              <span className="text-blue-600">Hearing & Balance</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8">
              Multi-Location Audiology Practice
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-red-800 mb-4">
                Exclusive Business Sale Opportunity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">🏆</div>
                  <div className="text-sm font-semibold text-gray-700">Established 2003</div>
                  <div className="text-xs text-gray-600">22 Years in Business</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">📍</div>
                  <div className="text-sm font-semibold text-gray-700">Two Strategic</div>
                  <div className="text-xs text-gray-600">Locations</div>
                </div>
                <div className="bg-white rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-900">💰</div>
                  <div className="text-sm font-semibold text-gray-700">{formatCurrency(etlData.businessMetrics.monthlyRevenue)}</div>
                  <div className="text-xs text-gray-600">Monthly Revenue Average</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Business Description */}
      <div className="bg-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            A Legacy of Excellence in Hearing Care
          </h2>
          <div className="prose prose-lg text-gray-600 max-w-none">
            <p className="mb-6">
              For over two decades, Cranberry Hearing & Balance Center has been the trusted name in audiology care across Pittsburgh. What started as a single practice in 2003 has grown into a thriving multi-location operation, serving thousands of patients with cutting-edge hearing solutions and compassionate care.
            </p>
            <p className="mb-6">
              Now, after 22 years of building relationships, perfecting processes, and establishing market dominance, the current owner is ready to pass the torch to the next generation. This isn't just a business sale—it's an opportunity to inherit a proven system, established patient base, and the reputation that comes with two decades of excellence.
            </p>
            <p className="text-xl font-semibold text-gray-900 text-center">
              The question isn't whether this is a good investment—it's whether you're ready to step into a legacy of success.
            </p>
          </div>
        </div>
      </div>

      {/* Limited Time Opportunity */}
      <div className="bg-red-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            🔥 LIMITED TIME OPPORTUNITY
          </h2>
          <p className="text-xl mb-8">
            Established {formatCurrency(etlData.businessMetrics.annualRevenue)} Annual Revenue Business + {formatCurrency(etlData.businessMetrics.equipmentValue)} Equipment - 29% Below Market Value
          </p>
          <p className="text-lg font-semibold mb-8">
            🔥 Qualified buyer already interested - act quickly!
          </p>
          
          <div className="bg-white text-gray-900 rounded-lg p-8 max-w-2xl mx-auto">
            <div className="text-4xl font-bold text-red-600 mb-2">
              {formatCurrency(etlData.businessMetrics.askingPrice)}
            </div>
            <div className="text-lg font-semibold mb-4">All-Inclusive Price</div>
            <div className="text-sm text-gray-600">29% Below Market Value</div>
          </div>
        </div>
      </div>

      {/* Business Metrics */}
      <BusinessMetrics data={etlData.businessMetrics} />

      {/* Investment Highlights */}
      <InvestmentHighlights highlights={etlData.investmentHighlights} />

      {/* Equipment Showcase */}
      <EquipmentShowcase equipment={etlData.equipmentCategories} />

      {/* Investment Calculator */}
      <InvestmentCalculator data={etlData.businessMetrics} />

      {/* Call to Action */}
      <CallToAction />
    </div>
  );
}

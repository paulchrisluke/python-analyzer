import { BusinessMetrics as BusinessMetricsType, formatCurrency, formatPercentage } from "@/lib/etl-data";

interface BusinessMetricsProps {
  data: BusinessMetricsType;
}

export function BusinessMetrics({ data }: BusinessMetricsProps) {
  const metrics = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.annualRevenue * 2.5), // 30 months of data (2.5×)
      description: "2023-2025 Q2 Performance",
      icon: "📊"
    },
    {
      title: "Annual EBITDA",
      value: formatCurrency(data.annualRevenue * (data.ebitdaMargin / 100)),
      description: "Projected Annual",
      icon: "💰"
    },
    {
      title: "ROI",
      value: formatPercentage(data.roi),
      description: "Annual Return",
      icon: "📈"
    },
    {
      title: "Equipment Value",
      value: formatCurrency(data.equipmentValue),
      description: "Included in Sale",
      icon: "🔧"
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            📊 Verified Financial Performance
          </h2>
          <p className="text-lg text-gray-600">
            30 Months of Verified Financial Data
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Recession-Resistant Healthcare Business
          </p>
          <p className="text-sm text-red-600 font-semibold">
            {formatCurrency(data.marketValue - data.askingPrice)} Below Market Value
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="text-3xl mb-3">{metric.icon}</div>
              <div className="text-2xl font-bold text-gray-900 mb-2">
                {metric.value}
              </div>
              <div className="text-sm font-semibold text-gray-700 mb-1">
                {metric.title}
              </div>
              <div className="text-xs text-gray-600">
                {metric.description}
              </div>
            </div>
          ))}
        </div>

        {/* Valuation Multiples */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            📊 Valuation Multiples
          </h3>
          <p className="text-center text-gray-600 mb-8">
            Industry-standard valuation metrics for audiology practices
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {(data.askingPrice / data.annualRevenue).toFixed(1)}x
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">Revenue Multiple</div>
              <div className="text-sm text-gray-600 mb-1">
                {formatCurrency(data.askingPrice)} ÷ {formatCurrency(data.annualRevenue)}
              </div>
              <div className="text-xs text-gray-500">
                Industry range: 0.8x - 1.2x annual revenue
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {(data.askingPrice / (data.annualRevenue * (data.ebitdaMargin / 100))).toFixed(1)}x
              </div>
              <div className="text-lg font-semibold text-gray-900 mb-2">EBITDA Multiple</div>
              <div className="text-sm text-gray-600 mb-1">
                {formatCurrency(data.askingPrice)} ÷ {formatCurrency(data.annualRevenue * (data.ebitdaMargin / 100))}
              </div>
              <div className="text-xs text-gray-500">
                Industry range: 3.0x - 5.0x annual EBITDA
              </div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">Our Price</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(data.askingPrice)}
              </div>
              <div className="text-sm text-gray-600">All-inclusive package</div>
            </div>
            
            <div className="bg-white rounded-lg p-4 text-center">
              <div className="text-lg font-semibold text-gray-900 mb-1">Market Value</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(data.marketValue)}
              </div>
              <div className="text-sm text-gray-600">Industry standard</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


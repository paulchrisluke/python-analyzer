"use client";

import { useState } from "react";
import { BusinessMetrics, formatCurrency, formatPercentage } from "@/lib/etl-data";

interface InvestmentCalculatorProps {
  data: BusinessMetrics;
}

export function InvestmentCalculator({ data }: InvestmentCalculatorProps) {
  const [customInvestment, setCustomInvestment] = useState(data.askingPrice);
  const [customAnnualRevenue, setCustomAnnualRevenue] = useState(data.annualRevenue);
  const [customEbitdaMargin, setCustomEbitdaMargin] = useState(data.ebitdaMargin);

  const calculateROI = (investment: number, revenue: number, margin: number) => {
    // Sanitize inputs: coerce to numbers, clamp negatives to zero
    const safeInvestment = Math.max(0, Number(investment) || 0);
    const safeRevenue = Math.max(0, Number(revenue) || 0);
    const safeMargin = Math.max(0, Math.min(100, Number(margin) || 0));
    
    // Short-circuit when investment is zero
    if (safeInvestment === 0) return 0;
    
    const annualEbitda = safeRevenue * (safeMargin / 100);
    
    // Short-circuit when annual EBITDA is zero
    if (annualEbitda === 0) return 0;
    
    const roi = (annualEbitda / safeInvestment) * 100;
    
    // Return safe value or 0 if not finite
    return Number.isFinite(roi) ? roi : 0;
  };

  const calculatePayback = (investment: number, revenue: number, margin: number) => {
    // Sanitize inputs: coerce to numbers, clamp negatives to zero
    const safeInvestment = Math.max(0, Number(investment) || 0);
    const safeRevenue = Math.max(0, Number(revenue) || 0);
    const safeMargin = Math.max(0, Math.min(100, Number(margin) || 0));
    
    const annualEbitda = safeRevenue * (safeMargin / 100);
    
    // Short-circuit when annual EBITDA is zero
    if (annualEbitda === 0) return 0;
    
    const payback = safeInvestment / annualEbitda;
    
    // Return safe value or 0 if not finite
    return Number.isFinite(payback) ? payback : 0;
  };

  const customROI = calculateROI(customInvestment, customAnnualRevenue, customEbitdaMargin);
  const customPayback = calculatePayback(customInvestment, customAnnualRevenue, customEbitdaMargin);

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Investment Calculator
          </h2>
          <p className="text-lg text-gray-600">
            Calculate your potential return on investment with real business data
          </p>
        </div>

        <div className="bg-white rounded-lg p-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Input Controls */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Investment Parameters
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Investment Amount
                </label>
                <input
                  type="number"
                  value={customInvestment}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setCustomInvestment(Number.isFinite(value) && value >= 0 ? value : 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Annual Revenue Projection
                </label>
                <input
                  type="number"
                  value={customAnnualRevenue}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setCustomAnnualRevenue(Number.isFinite(value) && value >= 0 ? value : 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  EBITDA Margin (%)
                </label>
                <input
                  type="number"
                  value={customEbitdaMargin}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setCustomEbitdaMargin(Number.isFinite(value) && value >= 0 && value <= 100 ? value : 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                onClick={() => {
                  setCustomInvestment(data.askingPrice);
                  setCustomAnnualRevenue(data.annualRevenue);
                  setCustomEbitdaMargin(data.ebitdaMargin);
                }}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
              >
                Reset to Business Data
              </button>
            </div>

            {/* Results */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Investment Returns
              </h3>
              
              <div className="space-y-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {Number.isFinite(customROI) ? formatPercentage(customROI) : "0%"}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Annual ROI</div>
                  <div className="text-xs text-gray-600">
                    Based on {formatCurrency(customAnnualRevenue * (customEbitdaMargin / 100))} annual EBITDA
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">
                    {Number.isFinite(customPayback) ? `${customPayback.toFixed(1)} years` : "0.0 years"}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Payback Period</div>
                  <div className="text-xs text-gray-600">
                    Time to recover {formatCurrency(customInvestment)} investment
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-gray-600">
                    {formatCurrency(customAnnualRevenue * (customEbitdaMargin / 100))}
                  </div>
                  <div className="text-sm font-medium text-gray-700">Annual EBITDA</div>
                  <div className="text-xs text-gray-600">
                    {formatPercentage(customEbitdaMargin)} of {formatCurrency(customAnnualRevenue)} revenue
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison with Business Data */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
              Comparison with Cranberry Hearing & Balance Center
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Business ROI</div>
                <div className="text-xl font-bold text-green-600">
                  {formatPercentage(data.roi)}
                </div>
                <div className="text-xs text-gray-500">vs Your ROI</div>
                <div className="text-sm font-medium text-gray-700">
                  {Number.isFinite(customROI) ? formatPercentage(customROI) : "0%"}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Business Payback</div>
                <div className="text-xl font-bold text-blue-600">
                  {data.paybackPeriod.toFixed(1)} years
                </div>
                <div className="text-xs text-gray-500">vs Your Payback</div>
                <div className="text-sm font-medium text-gray-700">
                  {Number.isFinite(customPayback) ? `${customPayback.toFixed(1)} years` : "0.0 years"}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm text-gray-600 mb-1">Asking Price</div>
                <div className="text-xl font-bold text-gray-600">
                  {formatCurrency(data.askingPrice)}
                </div>
                <div className="text-xs text-gray-500">All-inclusive</div>
                <div className="text-sm font-medium text-gray-700">
                  + {formatCurrency(data.equipmentValue)} equipment
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


import { formatCurrency } from "@/lib/etl-data";

interface CallToActionProps {
  askingPrice: number;
}

export function CallToAction({ askingPrice }: CallToActionProps) {
  return (
    <div className="bg-blue-600 text-white py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          Ready to Invest?
        </h2>
        <p className="text-xl mb-8">
          This is a limited-time opportunity to acquire a proven audiology practice at 29% below market value.
        </p>
        
        <div className="bg-white text-gray-900 rounded-lg p-8 mb-8">
          <h3 className="text-2xl font-bold mb-4">Access Due Diligence Documents</h3>
          <p className="text-lg mb-6">
            Complete financial, legal, and operational documentation ready for qualified buyers
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {Number.isFinite(askingPrice) ? formatCurrency(askingPrice) : '—'}
              </div>
              <div className="text-sm font-semibold text-gray-700 mb-1">
                All-Inclusive Package
              </div>
              <div className="text-xs text-gray-600">
                Business + Equipment + Everything
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="text-lg font-semibold text-gray-700 mb-2">
                Complete Due Diligence Package Available
              </div>
              <div className="text-sm text-gray-600">
                Financial statements, legal documents, equipment lists, and more
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="text-lg font-semibold">
            Contact: Business Sale Team
          </div>
          <div className="text-sm opacity-90">
            Available: Immediate response
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-blue-500">
          <p className="text-sm opacity-90">
            © 2025 Cranberry Hearing & Balance Center. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}


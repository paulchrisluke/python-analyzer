import { AuthGuard } from "@/components/auth-guard"

export default function DocsPage() {
  return (
    <AuthGuard>
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Due Diligence Documents</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Financial Reports</h2>
            <p className="text-gray-600 mb-4">Access to financial statements, tax documents, and revenue analysis.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              View Reports
            </button>
          </div>
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Equipment Analysis</h2>
            <p className="text-gray-600 mb-4">Detailed equipment inventory and valuation reports.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              View Equipment
            </button>
          </div>
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-3">Legal Documents</h2>
            <p className="text-gray-600 mb-4">Leases, insurance contracts, and legal agreements.</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
              View Documents
            </button>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}

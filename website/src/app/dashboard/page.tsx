import { AdminOrBuyer } from "@/components/nextauth-guard"
import { DashboardContent } from "./dashboard-content"

export default function Page() {
  return (
    <AdminOrBuyer>
      <DashboardContent />
    </AdminOrBuyer>
  )
}

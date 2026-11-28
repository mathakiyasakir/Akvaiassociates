import { ProtectedPageShell } from "@/components/ProtectedPageShell";
import { OrdersTabView } from "@/components/OrdersTabView";

export default function OrdersPage() {
  return (
    <ProtectedPageShell
      tab="orders"
      title="Your Project Orders"
      subtitle="Sign in to download your Bill Receipt PDFs, track architectural progress, download final drawings, and submit reviews or revision requests."
    >
      <OrdersTabView />
    </ProtectedPageShell>
  );
}

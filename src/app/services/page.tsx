import { Navbar } from "@/components/Navbar";
import { ServiceTabView } from "@/components/ServiceTabView";
import { BottomNav } from "@/components/BottomNav";

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#1C1B19]">
      <Navbar />
      <main>
        <ServiceTabView />
      </main>
      <BottomNav />
    </div>
  );
}

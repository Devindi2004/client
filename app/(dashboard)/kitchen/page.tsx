import type { Metadata } from "next";
import { KitchenDashboard } from "@/components/dashboard/kitchen-dashboard";

export const metadata: Metadata = {
  title: "Kitchen Dashboard",
  description: "DineFlow kitchen order management dashboard.",
};

export default function KitchenPage() {
  return <KitchenDashboard />;
}

import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, BarChart3, ClipboardList, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getAnalyticsDashboardData } from "@/lib/data/analytics";
import { mockInventoryAlerts } from "@/lib/data/inventory";
import { formatCurrency } from "@/lib/data/menu";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "DineFlow admin dashboard.",
};

export default function AdminPage() {
  const analytics = getAnalyticsDashboardData("7d");
  const metricCards = [
    {
      label: "Revenue",
      value: analytics.metrics[0]?.value ?? "LKR 0",
      icon: BarChart3,
    },
    {
      label: "Orders",
      value: analytics.metrics[1]?.value ?? "0",
      icon: ClipboardList,
    },
    {
      label: "Top item",
      value: "Lagoon Crab Kottu",
      icon: Utensils,
    },
    {
      label: "Low stock",
      value: String(mockInventoryAlerts.length),
      icon: AlertTriangle,
    },
  ];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(6,78,59,0.34),rgba(24,24,27,0.88),rgba(124,45,18,0.18))] p-5">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-orange-200">
            Owner cockpit
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Admin dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Revenue, orders, inventory risk, menu performance, and reports.
          </p>
          <Button asChild className="mt-5 bg-emerald-400 text-zinc-950 hover:bg-emerald-300">
            <Link href="/admin/analytics">Open full analytics</Link>
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {metricCards.map(({ icon: Icon, label, value }) => (
            <Card key={label} className="rounded-lg border border-white/10 bg-white/[0.035] py-0">
              <CardContent className="p-5">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-200">
                  <Icon className="size-5" />
                </div>
                <p className="mt-5 text-sm text-zinc-400">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1fr_0.7fr]">
          <Card className="rounded-lg border border-white/10 bg-white/[0.035] py-0">
            <CardContent className="p-5">
              <h2 className="font-semibold">Recent orders</h2>
              <div className="mt-4 space-y-3">
                {analytics.recentOrders.map((order) => (
                  <div key={order.id} className="flex justify-between rounded-lg bg-black/20 p-3 text-sm">
                    <span>{order.id} · {order.table}</span>
                    <span className="text-emerald-200">{formatCurrency(order.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-lg border border-white/10 bg-white/[0.035] py-0">
            <CardContent className="p-5">
              <h2 className="font-semibold">Inventory alerts</h2>
              <div className="mt-4 space-y-3">
                {mockInventoryAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-orange-300/15 bg-orange-400/10 p-3 text-sm">
                    <p className="font-medium text-orange-100">{alert.item}</p>
                    <p className="text-zinc-400">
                      {alert.currentStock} {alert.unit} left
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}

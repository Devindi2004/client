import type { Metadata } from "next";
import Link from "next/link";
import { Clock3, PackageCheck, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockOrders } from "@/lib/data/orders";
import { formatCurrency } from "@/lib/data/menu";

export const metadata: Metadata = {
  title: "Order Tracking",
  description: "Track your DineFlow orders in real time.",
};

export default function TrackingPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pb-28 text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <section className="rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(6,78,59,0.34),rgba(24,24,27,0.88),rgba(124,45,18,0.18))] p-5">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-orange-200">
            Live orders
          </p>
          <h1 className="mt-3 text-3xl font-semibold">Order tracking</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Follow preparation status from kitchen acceptance to table delivery.
          </p>
        </section>

        <div className="mt-5 grid gap-4">
          {mockOrders.slice(0, 3).map((order) => (
            <Card
              key={order.id}
              className="rounded-lg border border-white/10 bg-white/[0.035] py-0"
            >
              <CardContent className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-zinc-400">{order.tableNumber && `Table ${order.tableNumber}`}</p>
                    <h2 className="mt-1 text-xl font-semibold">{order.orderNumber}</h2>
                    <p className="mt-2 text-sm text-zinc-400">
                      {order.items.map((item) => `${item.quantity}x ${item.name}`).join(", ")}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <StatusBadge status={order.status} />
                    <p className="mt-2 text-sm font-semibold text-emerald-200">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-4 gap-2">
                  {["new", "preparing", "ready", "completed"].map((status, index) => {
                    const activeIndex = ["new", "preparing", "ready", "completed"].indexOf(
                      order.status
                    );
                    return (
                      <div
                        key={status}
                        className={
                          index <= activeIndex
                            ? "h-2 rounded-full bg-emerald-400"
                            : "h-2 rounded-full bg-white/10"
                        }
                      />
                    );
                  })}
                </div>
                <Button
                  asChild
                  className="mt-5 min-h-10 bg-orange-400 text-zinc-950 hover:bg-orange-300"
                >
                  <Link href={`/tracking/${order.orderNumber}`}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const icon =
    status === "completed" ? (
      <PackageCheck className="size-4" />
    ) : status === "ready" ? (
      <Utensils className="size-4" />
    ) : (
      <Clock3 className="size-4" />
    );

  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-sm capitalize text-emerald-100">
      {icon}
      {status}
    </span>
  );
}

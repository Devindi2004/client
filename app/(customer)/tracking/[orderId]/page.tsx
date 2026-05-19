import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOrders } from "@/lib/data/orders";
import { formatCurrency } from "@/lib/data/menu";

export const metadata: Metadata = {
  title: "Order Details",
  description: "Track a DineFlow order.",
};

type TrackingDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function TrackingDetailPage({
  params,
}: TrackingDetailPageProps) {
  const { orderId } = await params;
  const order =
    mockOrders.find((item) => item.orderNumber === orderId) ?? mockOrders[0];

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 pb-28 text-white sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Button asChild variant="ghost" className="mb-4 text-zinc-300">
          <Link href="/tracking">
            <ArrowLeft className="size-4" />
            Back to orders
          </Link>
        </Button>
        <Card className="rounded-lg border border-white/10 bg-white/[0.035] py-0">
          <CardHeader className="border-b border-white/10 px-5 py-4">
            <CardTitle>{order.orderNumber}</CardTitle>
            <p className="text-sm text-zinc-400">
              Table {order.tableNumber} · {order.customerName}
            </p>
          </CardHeader>
          <CardContent className="p-5">
            <div className="rounded-lg border border-emerald-300/15 bg-emerald-300/[0.045] p-4">
              <div className="flex items-center gap-3">
                <Clock3 className="size-5 text-emerald-200" />
                <div>
                  <p className="font-semibold capitalize">{order.status}</p>
                  <p className="text-sm text-zinc-400">
                    Kitchen updates will stream here through Socket.IO.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between rounded-lg border border-white/10 bg-black/20 p-3"
                >
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-emerald-200">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-between border-t border-white/10 pt-4 font-semibold">
              <span>Total</span>
              <span className="text-emerald-200">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

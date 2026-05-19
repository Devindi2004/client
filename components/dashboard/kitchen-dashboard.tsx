"use client";

import { useEffect, useMemo, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { ChefHat, Clock3, Flame, PackageCheck } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockOrders } from "@/lib/data/orders";
import { formatCurrency } from "@/lib/data/menu";
import type { CustomerOrder, OrderStatus } from "@/types/order";

const columns: { label: string; status: OrderStatus; icon: typeof Clock3 }[] = [
  { label: "New Orders", status: "new", icon: Clock3 },
  { label: "Preparing", status: "preparing", icon: Flame },
  { label: "Ready", status: "ready", icon: ChefHat },
  { label: "Completed", status: "completed", icon: PackageCheck },
];

const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  new: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null,
};

export function KitchenDashboard() {
  const [orders, setOrders] = useState<CustomerOrder[]>(mockOrders);

  useEffect(() => {
    let socket: Socket | null = null;

    if (process.env.NEXT_PUBLIC_SOCKET_URL) {
      socket = io(process.env.NEXT_PUBLIC_SOCKET_URL, {
        transports: ["websocket"],
      });
      socket.on("order:update", (updatedOrder: CustomerOrder) => {
        setOrders((current) =>
          current.map((order) =>
            order.id === updatedOrder.id ? updatedOrder : order
          )
        );
      });
    }

    return () => {
      socket?.disconnect();
    };
  }, []);

  const groupedOrders = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        orders: orders.filter((order) => order.status === column.status),
      })),
    [orders]
  );

  const moveOrder = (orderId: string, status: OrderStatus) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, status } : order
      )
    );
    toast.success("Order status updated", {
      description: `Order moved to ${status}.`,
    });
  };

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-lg border border-white/10 bg-[linear-gradient(135deg,rgba(6,78,59,0.34),rgba(24,24,27,0.88),rgba(124,45,18,0.18))] p-5">
          <Badge className="border-emerald-300/20 bg-emerald-300/10 text-emerald-100">
            Socket.IO ready
          </Badge>
          <h1 className="mt-4 text-3xl font-semibold">Kitchen dashboard</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Track QR orders from pending to preparing, ready, and completed.
          </p>
        </section>

        <section className="mt-5 grid gap-4 xl:grid-cols-4">
          {groupedOrders.map((column) => {
            const Icon = column.icon;

            return (
              <div key={column.status} className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 text-emerald-200" />
                    <h2 className="font-semibold">{column.label}</h2>
                  </div>
                  <span className="rounded-full bg-black/30 px-2 py-1 text-xs text-zinc-300">
                    {column.orders.length}
                  </span>
                </div>

                {column.orders.map((order) => (
                  <Card
                    key={order.id}
                    className="rounded-lg border border-white/10 bg-zinc-900/78 py-0"
                  >
                    <CardHeader className="border-b border-white/10 px-4 py-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <span>{order.orderNumber}</span>
                        <span className="text-sm text-emerald-200">
                          Table {order.tableNumber}
                        </span>
                      </CardTitle>
                      <p className="text-xs text-zinc-400">
                        {new Date(order.createdAt).toLocaleTimeString("en-LK", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        {order.items.map((item) => (
                          <div key={item.id} className="text-sm text-zinc-300">
                            {item.quantity}x {item.name}
                          </div>
                        ))}
                      </div>
                      {order.specialInstructions && (
                        <p className="mt-3 rounded-md bg-orange-400/10 p-2 text-xs text-orange-100">
                          {order.specialInstructions}
                        </p>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <span className="text-sm font-semibold text-emerald-200">
                          {formatCurrency(order.totalAmount)}
                        </span>
                        {nextStatus[order.status] && (
                          <Button
                            size="sm"
                            className="bg-emerald-400 text-zinc-950 hover:bg-emerald-300"
                            onClick={() =>
                              moveOrder(order.id, nextStatus[order.status]!)
                            }
                          >
                            Move
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

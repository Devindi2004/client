import type { CustomerOrder } from "@/types/order";

export type ServerToClientEvents = {
  "order:new": (order: CustomerOrder) => void;
  "order:update": (order: CustomerOrder) => void;
  "kitchen:ping": (payload: { activeOrders: number }) => void;
};

export type ClientToServerEvents = {
  "order:subscribe": (payload: { orderNumber: string }) => void;
  "kitchen:join": (payload: { restaurantId: string }) => void;
  "order:status": (payload: { orderId: string; status: string }) => void;
};

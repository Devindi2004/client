import { api, isApiUnavailable } from "@/lib/api";
import { mockOrders } from "@/lib/data/orders";
import type { CheckoutPayload, CustomerOrder, OrderStatus } from "@/types/order";

export async function getOrders() {
  try {
    const response = await api.get<{ data: CustomerOrder[] }>("/api/orders");
    return response.data.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return mockOrders;
    }
    return mockOrders;
  }
}

export async function createOrder(payload: CheckoutPayload) {
  try {
    const response = await api.post<{ data: CustomerOrder }>("/api/orders", payload);
    return response.data.data;
  } catch {
    const orderNumber = `DF-${Math.floor(Math.random() * 90000) + 10000}`;
    return {
      id: `ord-${Date.now()}`,
      orderNumber,
      status: "new" as OrderStatus,
      tableNumber: payload.tableNumber,
      customerName: payload.customerName,
      contactNumber: payload.contactNumber,
      specialInstructions: payload.specialInstructions,
      paymentMethod: payload.paymentMethod,
      totalAmount: payload.totalAmount,
      createdAt: new Date().toISOString(),
      items: payload.items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        specialInstructions: item.notes,
      })),
    };
  }
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  try {
    const response = await api.patch<{ data: CustomerOrder }>(`/api/orders/${orderId}`, {
      status,
    });
    return response.data.data;
  } catch {
    return mockOrders.find((order) => order.id === orderId) ?? null;
  }
}

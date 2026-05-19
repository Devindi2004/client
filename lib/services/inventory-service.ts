import { api, isApiUnavailable } from "@/lib/api";
import { mockInventoryAlerts } from "@/lib/data/inventory";
import type { InventoryAlert } from "@/types/inventory";

export async function getInventoryAlerts() {
  try {
    const response = await api.get<{ data: InventoryAlert[] }>("/api/inventory/alerts");
    return response.data.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return mockInventoryAlerts;
    }
    return mockInventoryAlerts;
  }
}

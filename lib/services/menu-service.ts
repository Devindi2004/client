import { api, isApiUnavailable } from "@/lib/api";
import { menuItems } from "@/lib/data/menu";
import type { MenuItem } from "@/types/menu";

export async function getMenuItems() {
  try {
    const response = await api.get<{ data: MenuItem[] }>("/api/menu");
    return response.data.data;
  } catch (error) {
    if (isApiUnavailable(error)) {
      return menuItems;
    }
    return menuItems;
  }
}

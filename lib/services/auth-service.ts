import { api } from "@/lib/api";
import type { AuthResponse } from "@/types/auth";

export async function demoLogin(role: "customer" | "waiter" | "chef" | "admin") {
  const response = await api.post<AuthResponse>("/api/auth/demo-login", { role });
  return response.data;
}

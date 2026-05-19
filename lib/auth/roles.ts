import type { UserRole } from "@/types/auth";

export function getRoleRedirect(role: UserRole) {
  if (role === "admin") {
    return "/admin/analytics";
  }

  if (role === "chef" || role === "waiter") {
    return "/kitchen";
  }

  return "/menu";
}

export function canAccessRoute(role: UserRole, pathname: string) {
  if (pathname.startsWith("/admin")) {
    return role === "admin";
  }

  if (pathname.startsWith("/kitchen")) {
    return role === "admin" || role === "chef" || role === "waiter";
  }

  return true;
}

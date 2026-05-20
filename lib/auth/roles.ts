import type { UserRole } from "@/types/auth";

export function getRoleRedirect(role: UserRole) {
  if (role === "admin") {
    return "/admin/analytics";
  }

  if (role === "chef" || role === "waiter" || role === "kitchen") {
    return "/kitchen";
  }

  return "/menu";
}

export function canAccessRoute(role: UserRole, pathname: string) {
  if (pathname.startsWith("/admin")) {
    return role === "admin";
  }

  if (pathname.startsWith("/kitchen")) {
    return (
      role === "admin" ||
      role === "chef" ||
      role === "waiter" ||
      role === "kitchen"
    );
  }

  if (
    pathname.startsWith("/profile") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/tracking")
  ) {
    return role === "customer";
  }

  return true;
}

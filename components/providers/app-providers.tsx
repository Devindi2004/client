"use client";

import { QueryProvider } from "@/components/providers/query-provider";
import { SocketProvider } from "@/components/providers/socket-provider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <SocketProvider>{children}</SocketProvider>
    </QueryProvider>
  );
}

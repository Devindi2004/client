"use client";

import axios from "axios";
import { create } from "zustand";
import {
  authApi,
  refreshAccessToken,
  setAccessToken,
  setSessionExpiredHandler,
} from "@/lib/auth/api-client";
import type { AuthResponse, AuthUser, UserRole } from "@/types/auth";

type AuthCredentials = {
  email: string;
  password: string;
};

type RegisterCredentials = AuthCredentials & {
  name: string;
  phone?: string;
  role: UserRole;
  restaurantId?: string;
};

type AuthState = {
  accessToken: string | null;
  error: string | null;
  hydrated: boolean;
  loading: boolean;
  user: AuthUser | null;
  hydrate: () => Promise<AuthUser | null>;
  login: (credentials: AuthCredentials) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<AuthResponse>;
};

function getAuthError(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const payload = error.response?.data as { error?: string } | undefined;
    return payload?.error ?? fallback;
  }

  return error instanceof Error ? error.message : fallback;
}

export const useAuthStore = create<AuthState>((set) => {
  setSessionExpiredHandler(() => {
    set({
      accessToken: null,
      error: "Your session expired. Please sign in again.",
      hydrated: true,
      loading: false,
      user: null,
    });
  });

  return {
    accessToken: null,
    error: null,
    hydrated: false,
    loading: false,
    user: null,

    hydrate: async () => {
      set({ loading: true, error: null });

      try {
        const payload = await refreshAccessToken();
        set({
          accessToken: payload.accessToken,
          hydrated: true,
          loading: false,
          user: payload.user,
        });

        return payload.user ?? null;
      } catch {
        setAccessToken(null);
        set({
          accessToken: null,
          hydrated: true,
          loading: false,
          user: null,
        });

        return null;
      }
    },

    login: async (credentials) => {
      set({ loading: true, error: null });

      try {
        const response = await axios.post<AuthResponse>(
          "/api/auth/login",
          credentials,
          { withCredentials: true }
        );
        const payload = response.data;

        if (!payload.accessToken || !payload.user) {
          throw new Error("Login response was missing authentication data.");
        }

        setAccessToken(payload.accessToken);
        set({
          accessToken: payload.accessToken,
          hydrated: true,
          loading: false,
          user: payload.user,
        });

        return payload;
      } catch (error) {
        const message = getAuthError(error, "Unable to login.");
        set({ accessToken: null, error: message, loading: false, user: null });
        throw new Error(message);
      }
    },

    logout: async () => {
      set({ loading: true, error: null });

      try {
        await axios.post("/api/auth/logout", undefined, {
          withCredentials: true,
        });
      } finally {
        setAccessToken(null);
        set({
          accessToken: null,
          hydrated: true,
          loading: false,
          user: null,
        });
      }
    },

    register: async (credentials) => {
      set({ loading: true, error: null });

      try {
        const response = await axios.post<AuthResponse>(
          "/api/auth/register",
          credentials,
          { withCredentials: true }
        );
        const payload = response.data;

        setAccessToken(payload.accessToken ?? null);
        set({
          accessToken: payload.accessToken ?? null,
          hydrated: true,
          loading: false,
          user: payload.user ?? null,
        });

        return payload;
      } catch (error) {
        const message = getAuthError(error, "Unable to register.");
        set({ accessToken: null, error: message, loading: false, user: null });
        throw new Error(message);
      }
    },
  };
});

export async function authFetch<T>(url: string) {
  const response = await authApi.get<T>(url);

  return response.data;
}

export function useAuth() {
  return useAuthStore();
}

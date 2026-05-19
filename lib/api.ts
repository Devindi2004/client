"use client";

import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "",
  withCredentials: true,
  timeout: 8000,
});

export function isApiUnavailable(error: unknown) {
  return axios.isAxiosError(error) && !error.response;
}

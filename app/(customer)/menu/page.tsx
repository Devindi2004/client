import type { Metadata } from "next";
import { MenuExperience } from "@/components/customer/menu-experience";

export const metadata: Metadata = {
  title: "Digital QR Menu",
  description:
    "Browse DineFlow's AI-powered QR menu with recommendations, smart filters, and cart checkout.",
};

export default function MenuPage() {
  return <MenuExperience />;
}

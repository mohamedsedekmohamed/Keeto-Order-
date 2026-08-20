"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/TopNav";

// Routes that should NOT show the shared TopNav
const HIDDEN_ON = ["/privacy", "/support"];

export default function ConditionalTopNav() {
  const pathname = usePathname();

  if (HIDDEN_ON.includes(pathname)) {
    return null;
  }

  return <TopNav />;
}

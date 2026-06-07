"use client";

import { useScrollReveal } from "@/lib/scroll-reveal";

/**
 * Client wrapper：在 server component 页面里启用 [data-reveal] 滚动入场
 */
export default function ScrollRevealClient() {
  useScrollReveal();
  return null;
}

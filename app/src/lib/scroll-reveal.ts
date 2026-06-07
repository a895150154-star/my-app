"use client";

import { useEffect } from "react";

/**
 * 在客户端组件里调用，启用 [data-reveal] 元素的滚动入场。
 * 兼容 prefers-reduced-motion（globals.css 内已降级）。
 */
export function useScrollReveal() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]"),
    );
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -80px 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

/**
 * 监听滚动给 .navbar 加 .scrolled 类，触发更不透明背景。
 */
export function useNavbarScroll(threshold = 60) {
  useEffect(() => {
    const onScroll = () => {
      const nav = document.querySelector(".navbar");
      if (!nav) return;
      nav.classList.toggle("scrolled", window.scrollY > threshold);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
}

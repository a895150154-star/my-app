import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FIN AI · A 股 AI 投研工作台",
  description:
    "基于 Agent Loop 架构的 A 股投研智能体。每条结论标注置信度与数据源——仅供参考，不构成投资建议。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Noto+Sans+SC:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}

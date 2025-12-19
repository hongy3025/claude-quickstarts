/**
 * 根布局组件
 * 定义应用的整体结构和元数据
 */

import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

/**
 * Inter字体配置
 * 使用拉丁字符子集优化加载性能
 */
const inter = Inter({ subsets: ["latin"] });

/**
 * 应用元数据配置
 * 定义了浏览器标签页显示的标题和描述
 */
export const metadata: Metadata = {
  title: "AI Chat Assistant",
  description: "Chat with an AI assistant powered by Anthropic",
};

/**
 * 根布局组件
 * 为所有页面提供统一的布局和主题配置
 *
 * @param children - 子组件内容
 * @returns 包含主题提供器的HTML文档结构
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} flex flex-col h-full`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}

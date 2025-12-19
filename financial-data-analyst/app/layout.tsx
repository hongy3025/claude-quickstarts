/**
 * @file 根布局组件 (Root Layout)
 * 
 * 该文件定义了应用程序的顶级结构，包括字体加载、主题提供者和全局样式。
 * 它包装了所有的页面内容，确保一致的 UI 结构和功能（如 Toast 通知）。
 */
import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

/**
 * 加载 Geist Sans 字体
 */
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

/**
 * 加载 Geist Mono 字体
 */
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

/**
 * 应用程序的元数据配置
 */
export const metadata: Metadata = {
  title: "金融数据分析助手",
  description: "基于 Claude 的金融数据可视化分析工具",
};

/**
 * 根布局组件
 * @param props - 组件属性
 * @param props.children - 要渲染的子页面内容
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

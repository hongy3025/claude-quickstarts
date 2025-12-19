/**
 * @file 主题提供者组件
 * 
 * 包装了 next-themes 的 ThemeProvider，为整个应用提供深色/浅色模式的支持。
 */
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * 主题提供者组件
 * @param props - 传递给 next-themes Provider 的属性
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

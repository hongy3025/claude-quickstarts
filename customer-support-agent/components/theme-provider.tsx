"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";

/**
 * 主题提供者组件
 * 封装了 next-themes 的 ThemeProvider，用于管理应用的主题状态（如明暗模式）
 * 
 * @param props - 主题提供者属性，包含 children 和 next-themes 的配置
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

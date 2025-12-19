/**
 * 顶部导航栏组件
 * 提供主题切换、颜色主题选择和部署链接功能
 */

"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { Moon, Sun, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { themes } from "@/styles/themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * 主题颜色映射
 * 定义不同主题对应的颜色值
 */
const themeColors = {
  neutral: "#000000",
  red: "#EF4444",
  violet: "#8B5CF6",
  blue: "#3B82F6",
  tangerine: "#F97316",
  emerald: "#10B981",
  amber: "#F59E0B",
} as const;

/**
 * 主题名称类型
 * 从主题配置中提取的主题名称联合类型
 */
type ThemeName = keyof typeof themes;

/**
 * 颜色圆圈组件
 * 显示主题颜色的圆形指示器，支持选中状态
 * 
 * @param themeName - 主题名称
 * @param isSelected - 是否被选中
 * @returns 主题颜色圆圈组件
 */
const ColorCircle = ({
  themeName,
  isSelected,
}: {
  themeName: ThemeName;
  isSelected: boolean;
}) => (
  <div
    className="relative border flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
    style={{ backgroundColor: themeColors[themeName] }}
  >
    {isSelected && (
      <div className="absolute inset-0 flex items-center justify-center">
        <Check className="text-white" size={12} />
      </div>
    )}
  </div>
);

/**
 * 顶部导航栏组件
 * 提供主题切换、颜色主题选择和部署链接功能
 * 
 * @returns 顶部导航栏组件
 */
const TopNavBar = () => {
  const { theme, setTheme } = useTheme();
  const [colorTheme, setColorTheme] = useState<ThemeName>("neutral");
  const [mounted, setMounted] = useState(false);

  /**
   * 组件挂载时的初始化逻辑
   * 从localStorage读取保存的颜色主题并应用
   */
  useEffect(() => {
    setMounted(true);
    const savedColorTheme = (localStorage.getItem("color-theme") ||
      "neutral") as ThemeName;
    setColorTheme(savedColorTheme);
    applyTheme(savedColorTheme, theme === "dark");
  }, [theme]);

/**
   * 应用主题变量到DOM
   * 根据选择的主题和明暗模式设置CSS自定义属性
   * 
   * @param newColorTheme - 新的颜色主题名称
   * @param isDark - 是否为暗色模式
   */
  const applyTheme = (newColorTheme: ThemeName, isDark: boolean) => {
    const root = document.documentElement;
    const themeVariables = isDark
      ? themes[newColorTheme].dark
      : themes[newColorTheme].light;

    Object.entries(themeVariables).forEach(([key, value]) => {
      root.style.setProperty(`--${key}`, value as string);
    });
  };

  /**
   * 处理颜色主题变更
   * 更新状态、保存到localStorage并应用新主题
   * 
   * @param newColorTheme - 新的颜色主题名称
   */
  const handleThemeChange = (newColorTheme: ThemeName) => {
    setColorTheme(newColorTheme);
    localStorage.setItem("color-theme", newColorTheme);
    applyTheme(newColorTheme, theme === "dark");
  };

  /**
   * 处理明暗模式变更
   * 更新Next.js主题并根据模式应用颜色主题
   * 
   * @param mode - 模式选择：light、dark或system
   */
  const handleModeChange = (mode: "light" | "dark" | "system") => {
    setTheme(mode);
    if (mode !== "system") {
      applyTheme(colorTheme, mode === "dark");
    }
  };

  /**
   * 防止水合不匹配
   * 在组件挂载前返回null，避免服务端和客户端渲染不一致
   */
  if (!mounted) {
    return null;
  }

  return (
    <nav className="text-foreground p-4 flex justify-between items-center">
      <div className="font-bold text-xl flex gap-2 items-center">
        <Image
          src={theme === "dark" ? "/wordmark-dark.svg" : "/wordmark.svg"}
          alt="Company Wordmark"
          width={112}
          height={20}
        />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <ColorCircle themeName={colorTheme} isSelected={false} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {(Object.keys(themes) as ThemeName[]).map((themeName) => (
              <DropdownMenuItem
                key={themeName}
                onClick={() => handleThemeChange(themeName)}
                className="flex items-center gap-2"
              >
                <ColorCircle
                  themeName={themeName}
                  isSelected={colorTheme === themeName}
                />
                {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleModeChange("light")}>
              浅色模式
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModeChange("dark")}>
              深色模式
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleModeChange("system")}>
              系统默认
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Link
          href="https://github.com/anthropics/anthropic-quickstarts"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="text-foreground">
            部署您自己的应用
          </Button>
        </Link>
      </div>
    </nav>
  );
};

export default TopNavBar;

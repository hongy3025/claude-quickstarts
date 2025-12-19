/**
 * @file 顶部导航栏组件
 * 
 * 提供应用程序的品牌展示和主题切换功能。
 */
"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * 顶部导航栏属性
 */
interface TopNavBarProps {
  /** 功能配置，用于控制某些 UI 元素的显示/隐藏 */
  features?: {
    /** 是否显示领域选择器 */
    showDomainSelector?: boolean;
    /** 是否显示视图模式选择器 */
    showViewModeSelector?: boolean;
    /** 是否显示提示词缓存信息 */
    showPromptCaching?: boolean;
  };
}

/**
 * 顶部导航栏组件
 * 
 * @param props - 组件属性
 */
const TopNavBar: React.FC<TopNavBarProps> = ({ features = {} }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // 确保在客户端挂载后再渲染，以避免服务器端渲染与客户端主题不匹配的问题
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center justify-between p-4">
      {/* 品牌 Logo 部分 */}
      <div className="font-bold text-xl flex gap-2 items-center">
        <Image
          src={theme === "dark" ? "/wordmark-dark.svg" : "/wordmark.svg"}
          alt="Company Wordmark"
          width={112}
          height={20}
        />
      </div>
      
      {/* 操作按钮部分 */}
      <div className="flex items-center gap-2">
        {/* 主题切换下拉菜单 */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">切换主题</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              浅色模式 (Light)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              深色模式 (Dark)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              跟随系统 (System)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default TopNavBar;

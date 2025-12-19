/**
 * 主页组件
 * 应用的主要页面，包含导航栏和聊天界面
 */

import React from "react";
import dynamic from "next/dynamic";
import TopNavBar from "@/components/TopNavBar";
import ChatArea from "@/components/ChatArea";
import config from "@/config";

/**
 * 左侧边栏组件（动态导入）
 * 使用动态导入来优化初始加载性能，禁用服务端渲染
 */
const LeftSidebar = dynamic(() => import("@/components/LeftSidebar"), {
  ssr: false,
});

/**
 * 右侧边栏组件（动态导入）
 * 使用动态导入来优化初始加载性能，禁用服务端渲染
 */
const RightSidebar = dynamic(() => import("@/components/RightSidebar"), {
  ssr: false,
});

/**
 * 主页组件
 * 构建应用的主要布局结构，包含顶部导航栏和可配置的侧边栏
 * 
 * @returns 主页布局组件，包含导航栏和聊天区域
 */
export default function Home() {
  return (
    <div className="flex flex-col h-screen w-full">
      <TopNavBar />
      <div className="flex flex-1 overflow-hidden h-screen w-full">
        {config.includeLeftSidebar && <LeftSidebar />}
        <ChatArea />
        {config.includeRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
}

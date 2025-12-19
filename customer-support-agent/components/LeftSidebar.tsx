"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  User,
  DollarSign,
  Info,
  Wrench,
  Zap,
  Building2,
  Scale,
  ChartBarBig,
  CircleHelp,
} from "lucide-react";

/**
 * @interface ThinkingContent
 * @description 定义AI思考过程内容的结构
 * @property {string} id - 内容的唯一标识符
 * @property {string} content - AI的思考文本内容
 * @property {string} [user_mood] - 检测到的用户情绪
 * @property {string[]} [matched_categories] - 匹配到的内容类别
 * @property {object} [debug] - 调试信息
 * @property {boolean} debug.context_used - 是否在RAG中使用了上下文
 */
interface ThinkingContent {
  id: string;
  content: string;
  user_mood?: string;
  matched_categories?: string[];
  debug?: {
    context_used: boolean;
  };
}

/**
 * 根据布尔值返回调试信息药丸的颜色类
 * @param {boolean} value - 是否使用了上下文
 * @returns {string} Tailwind CSS颜色类
 */
const getDebugPillColor = (value: boolean): string => {
  return value
    ? "bg-green-100 text-green-800 border-green-300" // 成功
    : "bg-yellow-100 text-yellow-800 border-yellow-300"; // 未使用/不相关
};

/**
 * 根据情绪字符串返回对应的颜色类
 * @param {string} mood - 用户情绪字符串
 * @returns {string} Tailwind CSS颜色类
 */
const getMoodColor = (mood: string): string => {
  const colors: { [key: string]: string } = {
    positive: "bg-green-100 text-green-800",
    negative: "bg-red-100 text-red-800",
    curious: "bg-blue-100 text-blue-800",
    frustrated: "bg-orange-100 text-orange-800",
    confused: "bg-yellow-100 text-yellow-800",
    neutral: "bg-gray-100 text-gray-800",
  };
  return colors[mood?.toLowerCase()] || "bg-gray-100 text-gray-800";
};

/**
 * @const {number} MAX_THINKING_HISTORY - 定义侧边栏中保留的思考历史记录的最大数量
 */
const MAX_THINKING_HISTORY = 15;

/**
 * 左侧边栏组件
 * 显示AI助手的思考过程、用户情绪和内容分类
 */
const LeftSidebar: React.FC = () => {
  /**
   * @property {ThinkingContent[]} thinkingContents - 存储AI思考过程内容的数组
   */
  const [thinkingContents, setThinkingContents] = useState<ThinkingContent[]>(
    [],
  );

  /**
   * 副作用钩子，用于监听 `updateSidebar` 自定义事件并更新思考内容
   */
  useEffect(() => {
    /**
     * 处理 `updateSidebar` 事件的回调函数
     * @param {CustomEvent<ThinkingContent>} event - 包含思考内容的自定义事件
     */
    const handleUpdateSidebar = (event: CustomEvent<ThinkingContent>) => {
      if (event.detail && event.detail.id) {
        console.log("🔍 调试：侧边栏事件：", event.detail);
        setThinkingContents((prev) => {
          const exists = prev.some((item) => item.id === event.detail.id);
          if (!exists) {
            console.log(
              "📝 新的思考条目：",
              event.detail.content.slice(0, 50) + "...",
            ); // 显示前50个字符

            // 添加时间戳！
            const enhancedEntry = {
              ...event.detail,
              timestamp: new Date().toISOString(),
            };

            const newHistory = [enhancedEntry, ...prev].slice(
              0,
              MAX_THINKING_HISTORY,
            ); // 始终保留最新的20条记录

            return newHistory;
          }
          return prev;
        });
      } else {
        console.warn("侧边栏事件详情中缺少 'id'：", event.detail);
      }
    };

    window.addEventListener(
      "updateSidebar",
      handleUpdateSidebar as EventListener,
    );
    return () =>
      window.removeEventListener(
        "updateSidebar",
        handleUpdateSidebar as EventListener,
      );
  }, []);

  return (
    <aside className="w-[380px] pl-4 overflow-hidden pb-4">
      <Card className="h-full overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-medium leading-none">
            助手思考过程
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto h-[calc(100%-45px)]">
          {thinkingContents.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              助手的内心独白将在此处显示，方便您进行调试。
            </div>
          ) : (
            thinkingContents.map((content) => (
              <Card
                key={content.id}
                className="mb-4 animate-fade-in-up"
                style={{
                  animationDuration: "600ms",
                  animationFillMode: "backwards",
                  animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)", // 这会增加弹性效果
                }}
              >
                <CardContent className="py-4">
                  <div className="text-sm text-muted-foreground">
                    {content.content}
                  </div>
                  {content.user_mood && content.debug && (
                    <div className="flex items-center space-x-2 mt-4 text-xs">
                      {/* 情绪 */}
                      <span
                        className={`px-2 py-1 rounded-full ${getMoodColor(content.user_mood)}`}
                      >
                        {content.user_mood.charAt(0).toUpperCase() +
                          content.user_mood.slice(1)}
                      </span>

                      <span
                        className={`px-2 py-1 rounded-full ${getDebugPillColor(content.debug.context_used)}`}
                      >
                        上下文: {content.debug.context_used ? "✅" : "❌"}
                      </span>
                    </div>
                  )}
                  {content.matched_categories &&
                    content.matched_categories.length > 0 && (
                      <div className="mt-2">
                        {content.matched_categories.map((category) => (
                          <div
                            key={category}
                            className="inline-flex items-center mr-2 mt-2 text-muted-foreground text-xs py-0"
                          >
                            {category === "account" && (
                              <User className="w-3 h-3 mr-1" />
                            )}
                            {category === "billing" && (
                              <DollarSign className="w-3 h-3 mr-1" />
                            )}
                            {category === "feature" && (
                              <Zap className="w-3 h-3 mr-1" />
                            )}
                            {category === "internal" && (
                              <Building2 className="w-3 h-3 mr-1" />
                            )}
                            {category === "legal" && (
                              <Scale className="w-3 h-3 mr-1" />
                            )}
                            {category === "other" && (
                              <CircleHelp className="w-3 h-3 mr-1" />
                            )}
                            {category === "technical" && (
                              <Wrench className="w-3 h-3 mr-1" />
                            )}
                            {category === "usage" && (
                              <ChartBarBig className="w-3 h-3 mr-1" />
                            )}
                            {category
                              .split("_")
                              .map(
                                (word) =>
                                  word.charAt(0).toUpperCase() + word.slice(1),
                              )
                              .join(" ")}
                          </div>
                        ))}
                      </div>
                    )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </aside>
  );
};

export default LeftSidebar;

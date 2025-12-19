"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FileIcon, MessageCircleIcon } from "lucide-react";
import FullSourceModal from "./FullSourceModal";

/**
 * @interface RAGSource
 * @description 定义RAG（检索增强生成）源的结构
 * @property {string} id - 源的唯一标识符
 * @property {string} fileName - 文件名
 * @property {string} snippet - 从源中提取的代码片段或文本
 * @property {number} score - 源与查询的相关性得分
 * @property {string} [timestamp] - 时间戳
 */
interface RAGSource {
  id: string;
  fileName: string;
  snippet: string;
  score: number;
  timestamp?: string;
}

/**
 * @interface RAGHistoryItem
 * @description 定义RAG历史记录项的结构
 * @property {RAGSource[]} sources - RAG源数组
 * @property {string} timestamp - 历史记录项的时间戳
 * @property {string} query - 用户的原始查询
 */
interface RAGHistoryItem {
  sources: RAGSource[];
  timestamp: string;
  query: string;
}

/**
 * @interface DebugInfo
 * @description 定义调试信息的结构
 * @property {boolean} context_used - 是否在RAG中使用了上下文
 */
interface DebugInfo {
  context_used: boolean;
}

/**
 * @interface SidebarEvent
 * @description 定义侧边栏事件的结构
 * @property {string} id - 事件的唯一标识符
 * @property {string} content - 事件内容
 * @property {string} [user_mood] - 用户情绪
 * @property {DebugInfo} [debug] - 调试信息
 */
interface SidebarEvent {
  id: string;
  content: string;
  user_mood?: string;
  debug?: DebugInfo;
}

/**
 * 截断文本片段以适应显示
 * @param {string} text - 要截断的文本
 * @returns {string} 截断后的文本或空字符串
 */
const truncateSnippet = (text: string): string => {
  return text?.length > 150 ? `${text.slice(0, 100)}...` : text || "";
};

/**
 * 根据分数返回对应的颜色类
 * @param {number} score - 相关性得分
 * @returns {string} Tailwind CSS颜色类
 */
const getScoreColor = (score: number): string => {
  if (score > 0.6) return "bg-green-100 text-green-800";
  if (score > 0.4) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
};

/**
 * @const {number} MAX_HISTORY - 定义侧边栏中保留的RAG历史记录的最大数量
 */
const MAX_HISTORY = 15;

/**
 * 右侧边栏组件
 * 显示RAG（检索增强生成）源的历史记录
 */
const RightSidebar: React.FC = () => {
  /**
   * @property {RAGHistoryItem[]} ragHistory - 存储RAG历史记录的数组
   */
  const [ragHistory, setRagHistory] = useState<RAGHistoryItem[]>([]);
  /**
   * @property {boolean} shouldShowSources - 控制是否应显示源信息
   */
  const [shouldShowSources, setShouldShowSources] = useState(false);
  /**
   * @property {boolean} isModalOpen - 控制完整源信息模态框的打开状态
   */
  const [isModalOpen, setIsModalOpen] = useState(false);
  /**
   * @property {RAGSource | null} selectedSource - 当前选中的要显示完整信息的源
   */
  const [selectedSource, setSelectedSource] = useState<RAGSource | null>(null);

  /**
   * 副作用钩子，用于监听 `updateRagSources` 和 `updateSidebar` 事件
   */
  useEffect(() => {
    /**
     * 更新RAG源的回调函数
     * @param {CustomEvent} event - 包含RAG源、查询和调试信息的自定义事件
     */
    const updateRAGSources = (
      event: CustomEvent<{
        sources: RAGSource[];
        query: string;
        debug?: DebugInfo;
      }>,
    ) => {
      console.log("🔍 接收到RAG事件：", event.detail);
      const { sources, query, debug } = event.detail;

      const shouldDisplaySources = debug?.context_used;

      if (
        Array.isArray(sources) &&
        sources.length > 0 &&
        shouldDisplaySources
      ) {
        const cleanedSources = sources.map((source) => ({
          ...source,
          snippet: source.snippet || "无可用预览",
          fileName:
            (source.fileName || "").replace(/_/g, " ").replace(".txt", "") ||
            "未命名",
          timestamp: new Date().toISOString(),
        }));

        const historyItem: RAGHistoryItem = {
          sources: cleanedSources,
          timestamp: new Date().toISOString(),
          query: query || "未知查询",
        };

        setRagHistory((prev) => {
          const newHistory = [historyItem, ...prev];
          return newHistory.slice(0, MAX_HISTORY);
        });

        console.log(
          "🔍 是否显示源：",
          shouldDisplaySources ? "是" : "否",
        );
      }
    };

    /**
     * 更新调试信息的回调函数
     * @param {CustomEvent<SidebarEvent>} event - 包含调试信息的侧边栏事件
     */
    const updateDebug = (event: CustomEvent<SidebarEvent>) => {
      const debug = event.detail.debug;
      const shouldShow = debug?.context_used ?? false;
      setShouldShowSources(shouldShow);
    };

    window.addEventListener(
      "updateRagSources" as any,
      updateRAGSources as EventListener,
    );
    window.addEventListener(
      "updateSidebar" as any,
      updateDebug as EventListener,
    );

    return () => {
      window.removeEventListener(
        "updateRagSources" as any,
        updateRAGSources as EventListener,
      );
      window.removeEventListener(
        "updateSidebar" as any,
        updateDebug as EventListener,
      );
    };
  }, []);

  /**
   * 处理查看完整源信息的点击事件
   * @param {RAGSource} source - 被点击的源
   */
  const handleViewFullSource = (source: RAGSource) => {
    setSelectedSource(source);
    setIsModalOpen(true);
  };

  const fadeInUpClass = "animate-fade-in-up";
  const fadeStyle = {
    animationDuration: "600ms",
    animationFillMode: "backwards",
    animationTimingFunction: "cubic-bezier(0.2, 0.8, 0.2, 1)",
  };

  return (
    <aside className="w-[380px] pr-4 overflow-hidden pb-4">
      <Card
        className={`${fadeInUpClass} h-full overflow-hidden`}
        style={fadeStyle}
      >
        <CardHeader>
          <CardTitle className="text-sm font-medium leading-none">
            知识库历史记录
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-y-auto h-[calc(100%-45px)]">
          {ragHistory.length === 0 && (
            <div className="text-sm text-muted-foreground">
              助手找到相关源后会在此处显示
            </div>
          )}
          {ragHistory.map((historyItem, index) => (
            <div
              key={historyItem.timestamp}
              className={`mb-6 ${fadeInUpClass}`}
              style={{ ...fadeStyle, animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center text-xs text-muted-foreground mb-2 gap-1">
                <MessageCircleIcon
                  size={14}
                  className="text-muted-foreground"
                />
                <span>{historyItem.query}</span>
              </div>
              {historyItem.sources.map((source, sourceIndex) => (
                <Card
                  key={source.id}
                  className={`mb-2 ${fadeInUpClass}`}
                  style={{
                    ...fadeStyle,
                    animationDelay: `${index * 100 + sourceIndex * 75}ms`,
                  }}
                >
                  <CardContent className="py-4">
                    <p className="text-sm text-muted-foreground">
                      {truncateSnippet(source.snippet)}
                    </p>
                    <div className="flex flex-col gap-2">
                      <div
                        className={`${getScoreColor(source.score)} px-2 py-1 mt-4 rounded-full text-xs inline-block w-fit`}
                      >
                        {(source.score * 100).toFixed(0)}% 匹配度
                      </div>
                      <div
                        className="inline-flex items-center mr-2 mt-2 text-muted-foreground text-xs py-0 cursor-pointer hover:text-gray-600"
                        onClick={() => handleViewFullSource(source)}
                      >
                        <FileIcon className="w-4 h-4 min-w-[12px] min-h-[12px] mr-2" />
                        <span className="text-xs underline">
                          {truncateSnippet(source.fileName || "未命名")}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
      <FullSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        source={selectedSource}
      />
    </aside>
  );
};

export default RightSidebar;

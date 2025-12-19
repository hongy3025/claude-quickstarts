// app/finance/page.tsx
/**
 * @file 金融助手聊天页面组件
 * 
 * 该页面提供了一个集成的聊天界面，允许用户：
 * 1. 与 AI (Claude) 进行关于金融数据的对话。
 * 2. 上传各种文件（CSV、PDF、图片）进行数据分析。
 * 3. 自动根据 AI 的分析结果生成并展示交互式图表。
 * 4. 实时切换不同的 AI 模型。
 */
"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  ChevronDown,
  Paperclip,
  ChartLine,
  ChartArea,
  FileInput,
  MessageCircleQuestion,
  ChartColumnBig,
} from "lucide-react";
import FilePreview from "@/components/FilePreview";
import { ChartRenderer } from "@/components/ChartRenderer";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChartData } from "@/types/chart";
import TopNavBar from "@/components/TopNavBar";
import {
  readFileAsText,
  readFileAsBase64,
  readFileAsPDFText,
} from "@/utils/fileHandling";

/**
 * 消息接口定义
 */
interface Message {
  /** 消息唯一标识符 */
  id: string;
  /** 消息角色：'user' | 'assistant' */
  role: string;
  /** 消息文本内容 */
  content: string;
  /** 标识是否触发了工具调用（如生成图表） */
  hasToolUse?: boolean;
  /** 消息关联的文件信息 */
  file?: {
    /** 文件的 Base64 编码数据 */
    base64: string;
    /** 文件名 */
    fileName: string;
    /** 媒体类型 (MIME type) */
    mediaType: string;
    /** 是否为纯文本文件 */
    isText?: boolean;
  };
  /** AI 生成的图表数据 */
  chartData?: ChartData;
}

/**
 * AI 模型配置定义
 */
type Model = {
  /** 模型标识符 */
  id: string;
  /** 模型显示名称 */
  name: string;
};

/**
 * 文件上传状态定义
 */
interface FileUpload {
  /** 文件的 Base64 编码数据 */
  base64: string;
  /** 文件名 */
  fileName: string;
  /** 媒体类型 */
  mediaType: string;
  /** 是否为文本文件 */
  isText?: boolean;
  /** 文件大小（字节） */
  fileSize?: number;
}

/**
 * 可选的 AI 模型列表
 */
const models: Model[] = [
  { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
  { id: "claude-haiku-4-5-20251001", name: "Claude 4.5 Haiku" },
  { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
];

/**
 * API 响应接口定义
 */
interface APIResponse {
  /** AI 生成的文本内容 */
  content: string;
  /** 是否包含工具调用 */
  hasToolUse: boolean;
  /** 工具调用详情 */
  toolUse?: {
    type: "tool_use";
    id: string;
    name: string;
    input: ChartData;
  };
  /** 处理后的图表数据 */
  chartData?: ChartData;
}

/**
 * 消息组件属性
 */
interface MessageComponentProps {
  /** 要显示的消息对象 */
  message: Message;
}

/**
 * 安全的图表渲染器组件
 * 封装了错误处理逻辑，确保图表渲染失败不会导致整个页面崩溃
 */
const SafeChartRenderer: React.FC<{ data: ChartData }> = ({ data }) => {
  try {
    return (
      <div className="w-full h-full p-6 flex flex-col">
        <div className="w-[90%] flex-1 mx-auto">
          <ChartRenderer data={data} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("图表渲染错误:", error);
    const errorMessage =
      error instanceof Error ? error.message : "发生未知错误";
    return (
      <div className="text-red-500">渲染图表时出错: {errorMessage}</div>
    );
  }
};

/**
 * 消息气泡组件
 * 根据发送者角色显示不同的样式和头像
 */
const MessageComponent: React.FC<MessageComponentProps> = ({ message }) => {
  // 用于调试的控制台日志
  console.log("带有图表数据的消息:", message);
  return (
    <div className="flex items-start gap-2">
      {message.role === "assistant" && (
        <Avatar className="w-8 h-8 border">
          <AvatarImage src="/ant-logo.svg" alt="AI 助手头像" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      <div
        className={`flex flex-col max-w-[75%] ${
          message.role === "user" ? "ml-auto" : ""
        }`}
      >
        <div
          className={`p-3 rounded-md text-base ${
            message.role === "user"
              ? "bg-primary text-primary-foreground"
              : "bg-muted border"
          }`}
        >
          {message.content === "thinking" ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
              {message.hasToolUse ? (
                <div className="flex flex-col gap-2">
                  <Badge variant="secondary" className="inline-flex">
                    <ChartLine className="w-4 h-4 mr-1" /> 已生成图表
                  </Badge>
                  <span>思考中...</span>
                </div>
              ) : (
                <span>思考中...</span>
              )}
            </div>
          ) : message.role === "assistant" ? (
            <div className="flex flex-col gap-2">
              {message.hasToolUse && (
                <Badge variant="secondary" className="inline-flex px-0">
                  <ChartLine className="w-4 h-4 mr-1" /> 已生成图表
                </Badge>
              )}
              <span>{message.content}</span>
            </div>
          ) : (
            <span>{message.content}</span>
          )}
        </div>
        {message.file && (
          <div className="mt-1.5">
            <FilePreview file={message.file} size="small" />
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 图表分页导航组件
 * 在页面右侧显示小圆点，用于在多个生成的图表之间快速切换
 */
const ChartPagination = ({
  total,
  current,
  onDotClick,
}: {
  /** 图表总数 */
  total: number;
  /** 当前选中的图表索引 */
  current: number;
  /** 点击圆点时的回调函数 */
  onDotClick: (index: number) => void;
}) => (
  <div className="fixed right-12 top-1/2 -translate-y-1/2 flex flex-col gap-2">
    {Array.from({ length: total }).map((_, i) => (
      <button
        key={i}
        onClick={() => onDotClick(i)}
        className={`w-2 h-2 rounded-full transition-all ${
          i === current
            ? "bg-primary scale-125"
            : "bg-muted hover:bg-primary/50"
        }`}
      />
    ))}
  </div>
);

export default function AIChat() {
  /** 聊天消息列表状态 */
  const [messages, setMessages] = useState<Message[]>([]);
  /** 当前输入框的文本状态 */
  const [input, setInput] = useState("");
  /** 标识是否正在等待 AI 响应 */
  const [isLoading, setIsLoading] = useState(false);
  /** 当前选择的 AI 模型 ID */
  const [selectedModel, setSelectedModel] = useState(
    "claude-3-5-sonnet-20240620",
  );
  /** 消息列表末尾的引用，用于自动滚动 */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  /** 图表列表末尾的引用 */
  const chartEndRef = useRef<HTMLDivElement>(null);
  /** 文件输入框的引用 */
  const fileInputRef = useRef<HTMLInputElement>(null);
  /** 当前待上传的文件信息状态 */
  const [currentUpload, setCurrentUpload] = useState<FileUpload | null>(null);
  /** 标识是否正在处理文件上传 */
  const [isUploading, setIsUploading] = useState(false);
  /** 当前显示的图表索引状态 */
  const [currentChartIndex, setCurrentChartIndex] = useState(0);
  /** 内容区域的引用，用于处理图表滚动 */
  const contentRef = useRef<HTMLDivElement>(null);
  /** 标识是否锁定自动滚动 */
  const [isScrollLocked, setIsScrollLocked] = useState(false);

  /**
   * 自动滚动聊天列表到最新消息
   */
  useEffect(() => {
    const scrollToBottom = () => {
      if (!messagesEndRef.current) return;

      // 使用 requestAnimationFrame 确保在 DOM 更新后执行滚动
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    };

    // 当消息列表或加载状态变化时触发滚动
    const timeoutId = setTimeout(scrollToBottom, 100);

    return () => clearTimeout(timeoutId);
  }, [messages, isLoading]);

  /**
   * 监听消息列表容器的大小变化，保持滚动位置
   */
  useEffect(() => {
    if (!messagesEndRef.current) return;

    const observer = new ResizeObserver(() => {
      if (!isScrollLocked) {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
    });

    observer.observe(messagesEndRef.current);

    return () => observer.disconnect();
  }, [isScrollLocked]);

  /**
   * 处理图表区域的滚动事件，更新当前图表索引
   */
  const handleChartScroll = useCallback(() => {
    if (!contentRef.current) return;

    const { scrollTop, clientHeight } = contentRef.current;
    const newIndex = Math.round(scrollTop / clientHeight);
    setCurrentChartIndex(newIndex);
  }, []);

  /**
   * 滚动到指定的图表索引
   */
  const scrollToChart = (index: number) => {
    if (!contentRef.current) return;

    const targetScroll = index * contentRef.current.clientHeight;
    contentRef.current.scrollTo({
      top: targetScroll,
      behavior: "smooth",
    });
  };

  /**
   * 当收到新的图表数据时，自动滚动到最新的图表
   */
  useEffect(() => {
    const scrollToNewestChart = () => {
      const chartsCount = messages.filter((m) => m.chartData).length;
      if (chartsCount > 0) {
        setCurrentChartIndex(chartsCount - 1);
        scrollToChart(chartsCount - 1);
      }
    };

    const lastChartIndex = messages.findLastIndex((m) => m.chartData);
    if (lastChartIndex !== -1) {
      setTimeout(scrollToNewestChart, 100);
    }
  }, [messages]);

  /**
   * 处理文件选择事件
   * 支持图片、PDF 和普通文本文件
   */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // 存储 Toast 句柄以便后续关闭
    let loadingToastRef: { dismiss: () => void } | undefined;

    if (file.type === "application/pdf") {
      loadingToastRef = toast({
        title: "正在处理 PDF",
        description: "正在提取文本内容...",
        duration: Infinity,
      });
    }

    try {
      const isImage = file.type.startsWith("image/");
      const isPDF = file.type === "application/pdf";
      let base64Data = "";
      let isText = false;

      if (isImage) {
        base64Data = await readFileAsBase64(file);
        isText = false;
      } else if (isPDF) {
        try {
          const pdfText = await readFileAsPDFText(file);
          base64Data = btoa(encodeURIComponent(pdfText));
          isText = true;
        } catch (error) {
          console.error("解析 PDF 失败:", error);
          toast({
            title: "PDF 解析失败",
            description: "无法从该 PDF 中提取文本",
            variant: "destructive",
          });
          return;
        }
      } else {
        try {
          const textContent = await readFileAsText(file);
          base64Data = btoa(encodeURIComponent(textContent));
          isText = true;
        } catch (error) {
          console.error("读取文本文件失败:", error);
          toast({
            title: "无效的文件类型",
            description: "文件必须是可读文本、PDF 或图片",
            variant: "destructive",
          });
          return;
        }
      }

      setCurrentUpload({
        base64: base64Data,
        fileName: file.name,
        mediaType: isText ? "text/plain" : file.type,
        isText,
      });

      toast({
        title: "文件已上传",
        description: `${file.name} 已准备好进行分析`,
      });
    } catch (error) {
      console.error("处理文件时出错:", error);
      toast({
        title: "上传失败",
        description: "无法处理该文件",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (loadingToastRef) {
        loadingToastRef.dismiss();
        // PDF 处理成功提示
        if (file.type === "application/pdf") {
          toast({
            title: "PDF 处理完成",
            description: "文本提取成功",
          });
        }
      }
    }
  };

  /**
   * 处理表单提交（发送消息）
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() && !currentUpload) return;
    if (isLoading) return;

    setIsScrollLocked(true);

    // 创建用户消息对象
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
      file: currentUpload || undefined,
    };

    // 创建一个临时的“思考中”消息
    const thinkingMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "thinking",
    };

    // 批量更新消息列表
    setMessages((prev) => [...prev, userMessage, thinkingMessage]);
    setInput("");
    setIsLoading(true);

    // 准备发送到 API 的消息数组
    const apiMessages = [...messages, userMessage].map((msg) => {
      if (msg.file) {
        if (msg.file.isText) {
          // 对于文本文件，解码内容并整合到文本中
          const decodedText = decodeURIComponent(atob(msg.file.base64));
          return {
            role: msg.role,
            content: `文件 ${msg.file.fileName} 的内容如下:\n\n${decodedText}\n\n${msg.content}`,
          };
        } else {
          // 处理图片文件
          return {
            role: msg.role,
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: msg.file.mediaType,
                  data: msg.file.base64,
                },
              },
              {
                type: "text",
                text: msg.content,
              },
            ],
          };
        }
      }
      // 处理纯文本消息
      return {
        role: msg.role,
        content: msg.content,
      };
    });

    const requestBody = {
      messages: apiMessages,
      model: selectedModel,
    };

    try {
      const response = await fetch("/api/finance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP 错误! 状态码: ${response.status}`);
      }

      const data: APIResponse = await response.json();

      // 将“思考中”消息替换为真正的 AI 回复
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.content,
          hasToolUse: data.hasToolUse || !!data.toolUse,
          chartData:
            data.chartData || (data.toolUse?.input as ChartData) || null,
        };
        return newMessages;
      });

      setCurrentUpload(null);
    } catch (error) {
      console.error("提交出错:", error);
      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "抱歉，我遇到了一个错误。请稍后再试。",
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
      setIsScrollLocked(false);

      // 强制在状态更新后进行最后一次滚动
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    }
  };

  /**
   * 处理键盘事件（Enter 键发送，Shift+Enter 换行）
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() || currentUpload) {
        const form = e.currentTarget.form;
        if (form) {
          const submitEvent = new Event("submit", {
            bubbles: true,
            cancelable: true,
          });
          form.dispatchEvent(submitEvent);
        }
      }
    }
  };

  /**
   * 处理输入框变化，并自动调整高度
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    setInput(textarea.value);
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  };

  return (
    <div className="flex flex-col h-screen">
      {/* 顶部导航栏 */}
      <TopNavBar
        features={{
          showDomainSelector: false,
          showViewModeSelector: false,
          showPromptCaching: false,
        }}
      />

      <div className="flex-1 flex bg-background p-4 pt-0 gap-4 h-[calc(100vh-4rem)]">
        {/* 聊天侧边栏 */}
        <Card className="w-1/3 flex flex-col h-full">
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {messages.length > 0 && (
                  <>
                    <Avatar className="w-8 h-8 border">
                      <AvatarImage
                        src="/ant-logo.svg"
                        alt="AI 助手头像"
                      />
                      <AvatarFallback>AI</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">
                        金融助手
                      </CardTitle>
                      <CardDescription className="text-xs">
                        由 Claude 提供支持
                      </CardDescription>
                    </div>
                  </>
                )}
              </div>

              {/* 模型选择下拉菜单 */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-8 text-sm">
                    {models.find((m) => m.id === selectedModel)?.name}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {models.map((model) => (
                    <DropdownMenuItem
                      key={model.id}
                      onSelect={() => setSelectedModel(model.id)}
                    >
                      {model.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          {/* 消息展示区域 */}
          <CardContent className="flex-1 overflow-y-auto p-4 scroll-smooth snap-y snap-mandatory">
            {messages.length === 0 ? (
              /* 初始欢迎界面 */
              <div className="flex flex-col items-center justify-center h-full animate-fade-in-up max-w-[95%] mx-auto">
                <Avatar className="w-10 h-10 mb-4 border">
                  <AvatarImage
                    src="/ant-logo.svg"
                    alt="AI 助手头像"
                    width={40}
                    height={40}
                  />
                </Avatar>
                <h2 className="text-xl font-semibold mb-2">
                  金融助手
                </h2>
                <div className="space-y-4 text-base">
                  <div className="flex items-center gap-3">
                    <ChartArea className="text-muted-foreground w-6 h-6" />
                    <p className="text-muted-foreground">
                      我可以分析金融数据，并根据您的文件创建可视化图表。
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileInput className="text-muted-foreground w-6 h-6" />
                    <p className="text-muted-foreground">
                      上传 CSV、PDF 或图片，我将帮您理解其中的数据。
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageCircleQuestion className="text-muted-foreground w-6 h-6" />
                    <p className="text-muted-foreground">
                      询问有关您金融数据的问题，我将为您创建有见地的图表。
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* 聊天消息列表 */
              <div className="space-y-4 min-h-full">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`animate-fade-in-up ${
                      message.content === "thinking" ? "animate-pulse" : ""
                    }`}
                  >
                    <MessageComponent message={message} />
                  </div>
                ))}
                <div ref={messagesEndRef} className="h-4" />{" "}
                {/* 增加高度以确保滚动空间 */}
              </div>
            )}
          </CardContent>

          {/* 消息输入区域 */}
          <CardFooter className="p-4 border-t">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex flex-col space-y-2">
                {/* 文件上传预览 */}
                {currentUpload && (
                  <FilePreview
                    file={currentUpload}
                    onRemove={() => setCurrentUpload(null)}
                  />
                )}
                <div className="flex items-end space-x-2">
                  <div className="flex-1 relative">
                    {/* 文件上传按钮 */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isLoading || isUploading}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8"
                    >
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    {/* 文本输入框 */}
                    <Textarea
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder="输入您的消息..."
                      disabled={isLoading}
                      className="min-h-[44px] h-[44px] resize-none pl-12 py-3 flex items-center"
                      rows={1}
                    />
                  </div>
                  {/* 发送按钮 */}
                  <Button
                    type="submit"
                    disabled={isLoading || (!input.trim() && !currentUpload)}
                    className="h-[44px]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {/* 隐藏的文件输入框 */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileSelect}
              />
            </form>
          </CardFooter>
        </Card>

        {/* 内容区域（图表展示） */}
        <Card className="flex-1 flex flex-col h-full overflow-hidden">
          {messages.some((m) => m.chartData) && (
            <CardHeader className="py-3 px-4 shrink-0">
              <CardTitle className="text-lg">
                分析与可视化
              </CardTitle>
            </CardHeader>
          )}
          <CardContent
            ref={contentRef}
            className="flex-1 overflow-y-auto min-h-0 snap-y snap-mandatory"
            onScroll={handleChartScroll}
          >
            {messages.some((m) => m.chartData) ? (
              <div className="min-h-full flex flex-col">
                {messages.map(
                  (message, index) =>
                    message.chartData && (
                      <div
                        key={`chart-${index}`}
                        className="w-full min-h-full flex-shrink-0 snap-start snap-always"
                        ref={
                          index ===
                          messages.filter((m) => m.chartData).length - 1
                            ? chartEndRef
                            : null
                        }
                      >
                        <SafeChartRenderer data={message.chartData} />
                      </div>
                    ),
                )}
              </div>
            ) : (
              /* 无图表时的占位状态 */
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="flex flex-col items-center justify-center gap-4 -translate-y-8">
                  <ChartColumnBig className="w-8 h-8 text-muted-foreground" />
                  <div className="space-y-2">
                    <CardTitle className="text-lg">
                      分析与可视化
                    </CardTitle>
                    <CardDescription className="text-base">
                      图表和详细分析将在您聊天时在此处显示
                    </CardDescription>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      <Badge variant="outline">柱状图</Badge>
                      <Badge variant="outline">面积图</Badge>
                      <Badge variant="outline">折线图</Badge>
                      <Badge variant="outline">饼图</Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {/* 图表分页圆点 */}
      {messages.some((m) => m.chartData) && (
        <ChartPagination
          total={messages.filter((m) => m.chartData).length}
          current={currentChartIndex}
          onDotClick={scrollToChart}
        />
      )}
    </div>
  );
}

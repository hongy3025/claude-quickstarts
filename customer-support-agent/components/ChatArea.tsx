/**
 * 聊天区域组件
 * 处理用户输入、消息显示和AI响应的核心聊天界面
 */

"use client";

import { useEffect, useRef, useState } from "react";
import config from "@/config";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import {
  HandHelping,
  WandSparkles,
  LifeBuoyIcon,
  BookOpenText,
  ChevronDown,
  Send,
} from "lucide-react";
import "highlight.js/styles/atom-one-dark.css";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * 打字机效果文本组件
 * 逐字符显示文本，模拟打字机效果
 * 
 * @param text - 要显示的文本
 * @param delay - 字符显示延迟（毫秒）
 * @returns 打字机效果的文本组件
 */
const TypedText = ({ text = "", delay = 5 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    if (!text) return;
    const timer = setTimeout(() => {
      setDisplayedText(text.substring(0, displayedText.length + 1));
    }, delay);
    return () => clearTimeout(timer);
  }, [text, displayedText, delay]);

  return <>{displayedText}</>;
};

/**
 * 思考内容类型定义
 * 定义AI响应中思考内容的结构
 */
type ThinkingContent = {
  id: string;
  content: string;
  user_mood: string;
  debug: any;
  matched_categories?: string[];
};

/**
 * 会话头部属性接口
 * 定义会话头部组件的属性类型
 */
interface ConversationHeaderProps {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  models: Model[];
  showAvatar: boolean;
}

/**
 * UI选择器组件
 * 当需要转接到人工客服时显示的按钮组件
 * 
 * @param redirectToAgent - 转接代理配置信息
 * @returns 转接按钮组件或null
 */
const UISelector = ({
  redirectToAgent,
}: {
  redirectToAgent: { should_redirect: boolean; reason: string };
}) => {
  if (redirectToAgent.should_redirect) {
    return (
      <Button
        size="sm"
        className="mt-2 flex items-center space-x-2"
        onClick={() => {
          console.log("🔥 Human Agent Connection Requested!", redirectToAgent);
          const event = new CustomEvent("humanAgentRequested", {
            detail: {
              reason: redirectToAgent.reason || "Unknown",
              mood: "frustrated",
              timestamp: new Date().toISOString(),
            },
          });
          window.dispatchEvent(event);
        }}
      >
        <LifeBuoyIcon className="w-4 h-4" />
        <small className="text-sm leading-none">与人工客服交谈</small>
      </Button>
    );
  }

  return null;
};

/**
 * 建议问题组件
 * 显示AI建议的后续问题按钮
 * 
 * @param questions - 建议的问题列表
 * @param onQuestionClick - 问题点击处理函数
 * @param isLoading - 是否正在加载状态
 * @returns 建议问题按钮组件或null
 */
const SuggestedQuestions = ({
  questions,
  onQuestionClick,
  isLoading,
}: {
  questions: string[];
  onQuestionClick: (question: string) => void;
  isLoading: boolean;
}) => {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-2 pl-10">
      {questions.map((question, index) => (
        <Button
          key={index}
          className="text-sm mb-2 mr-2 ml-0 text-gray-500 shadow-sm"
          variant="outline"
          size="sm"
          onClick={() => onQuestionClick(question)}
          disabled={isLoading}
        >
          {question}
        </Button>
      ))}
    </div>
  );
};

/**
 * 消息内容组件
 * 解析并显示AI响应内容，支持Markdown渲染和错误处理
 * 
 * @param content - 消息内容
 * @param role - 消息角色（user或assistant）
 * @returns 解析后的消息内容组件
 */
const MessageContent = ({
  content,
  role,
}: {
  content: string;
  role: string;
}) => {
  const [thinking, setThinking] = useState(true);
  const [parsed, setParsed] = useState<{
    response?: string;
    thinking?: string;
    user_mood?: string;
    suggested_questions?: string[];
    redirect_to_agent?: { should_redirect: boolean; reason: string };
    debug?: {
      context_used: boolean;
    };
  }>({});
  const [error, setError] = useState(false);

  /**
   * 解析AI响应内容
   * 处理JSON解析和超时错误
   */
  useEffect(() => {
    if (!content || role !== "assistant") return;

    // 设置30秒超时
    const timer = setTimeout(() => {
      setError(true);
      setThinking(false);
    }, 30000);

    try {
      const result = JSON.parse(content);
      console.log("🔍 Parsed Result:", result);

      if (
        result.response &&
        result.response.length > 0 &&
        result.response !== "..."
      ) {
        setParsed(result);
        setThinking(false);
        clearTimeout(timer);
      }
    } catch (error) {
      console.error("Error parsing JSON:", error);
      setError(true);
      setThinking(false);
    }

    return () => clearTimeout(timer);
  }, [content, role]);

  if (thinking && role === "assistant") {
    return (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2" />
        <span>思考中...</span>
      </div>
    );
  }

  if (error && !parsed.response) {
    return <div>出了点问题，请重试。</div>;
  }

  return (
    <>
      <ReactMarkdown rehypePlugins={[rehypeRaw, rehypeHighlight]}>
        {parsed.response || content}
      </ReactMarkdown>
      {parsed.redirect_to_agent && (
        <UISelector redirectToAgent={parsed.redirect_to_agent} />
      )}
    </>
  );
};

/**
 * 模型类型定义
 * 定义AI模型的基本结构
 */
type Model = {
  id: string;
  name: string;
};

/**
 * 消息接口
 * 定义聊天消息的结构
 */
interface Message {
  id: string;
  role: string;
  content: string;
}

/**
 * 会话头部属性接口
 * 定义会话头部组件的属性类型
 */
interface ConversationHeaderProps {
  selectedModel: string;
  setSelectedModel: (modelId: string) => void;
  models: Model[];
  showAvatar: boolean;
  selectedKnowledgeBase: string;
  setSelectedKnowledgeBase: (knowledgeBaseId: string) => void;
  knowledgeBases: KnowledgeBase[];
}

/**
 * 知识库类型定义
 * 定义知识库的基本结构
 */
type KnowledgeBase = {
  id: string;
  name: string;
};

/**
 * 会话头部组件
 * 显示AI助手信息和模型选择器
 * 
 * @param selectedModel - 当前选中的模型ID
 * @param setSelectedModel - 模型选择变更处理函数
 * @param models - 可用模型列表
 * @param showAvatar - 是否显示头像
 * @param selectedKnowledgeBase - 当前选中的知识库ID
 * @param setSelectedKnowledgeBase - 知识库选择变更处理函数
 * @param knowledgeBases - 可用知识库列表
 * @returns 会话头部组件
 */
const ConversationHeader: React.FC<ConversationHeaderProps> = ({
  selectedModel,
  setSelectedModel,
  models,
  showAvatar,
  selectedKnowledgeBase,
  setSelectedKnowledgeBase,
  knowledgeBases,
}) => (
  <div className="p-0 flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 animate-fade-in">
    <div className="flex items-center space-x-4 mb-2 sm:mb-0">
      {showAvatar && (
        <>
          <Avatar className="w-10 h-10 border">
            <AvatarImage
              src="/ant-logo.svg"
              alt="AI Assistant Avatar"
              width={40}
              height={40}
            />
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-sm font-medium leading-none">AI Agent</h3>
            <p className="text-sm text-muted-foreground">客户支持</p>
          </div>
        </>
      )}
    </div>
    <div className="flex space-x-2 w-full sm:w-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex-grow text-muted-foreground sm:flex-grow-0"
          >
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex-grow text-muted-foreground  sm:flex-grow-0"
          >
            {knowledgeBases.find((kb) => kb.id === selectedKnowledgeBase)
              ?.name || "Select KB"}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {knowledgeBases.map((kb) => (
            <DropdownMenuItem
              key={kb.id}
              onSelect={() => setSelectedKnowledgeBase(kb.id)}
            >
              {kb.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

/**
 * 聊天区域主组件
 * 管理整个聊天界面的状态和交互
 */
function ChatArea() {
  /**
   * @property {Message[]} messages - 存储聊天消息的数组
   */
  const [messages, setMessages] = useState<Message[]>([]);
  /**
   * @property {string} input - 用户输入框的当前值
   */
  const [input, setInput] = useState("");
  /**
   * @property {boolean} isLoading - 指示是否正在等待AI响应
   */
  const [isLoading, setIsLoading] = useState(false);
  /**
   * @property {boolean} showHeader - 控制会话头部是否显示
   */
  const [showHeader, setShowHeader] = useState(false);
  /**
   * @property {string} selectedModel - 当前选择的AI模型ID
   */
  const [selectedModel, setSelectedModel] = useState("claude-haiku-4-5-20251001");
  /**
   * @property {boolean} showAvatar - 控制AI头像是否显示
   */
  const [showAvatar, setShowAvatar] = useState(false);

  /**
   * @property {React.RefObject<HTMLDivElement>} messagesEndRef - 引用消息列表末尾的元素，用于自动滚动
   */
  const messagesEndRef = useRef<HTMLDivElement>(null);
  /**
   * @property {string} selectedKnowledgeBase - 当前选择的知识库ID
   */
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(
    "your-knowledge-base-id",
  );

  /**
   * @const {KnowledgeBase[]} knowledgeBases - 可用的知识库列表
   */
  const knowledgeBases: KnowledgeBase[] = [
    { id: "your-knowledge-base-id", name: "Your KB Name" },
    // 在此添加更多知识库
  ];

  /**
   * @const {Model[]} models - 可用的AI模型列表
   */
  const models: Model[] = [
    { id: "claude-3-haiku-20240307", name: "Claude 3 Haiku" },
    { id: "claude-haiku-4-5-20251001", name: "Claude 4.5 Haiku" },
    { id: "claude-3-5-sonnet-20240620", name: "Claude 3.5 Sonnet" },
  ];

  /**
   * 滚动到消息列表底部
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * 当消息列表更新时，自动滚动到最新的消息
   */
  useEffect(() => {
    console.log("🔍 消息变更！数量：", messages.length);

    const scrollToNewestMessage = () => {
      if (messagesEndRef.current) {
        console.log("📜 正在滚动到最新消息...");
        const behavior = messages.length <= 2 ? "auto" : "smooth";
        messagesEndRef.current.scrollIntoView({ behavior, block: "end" });
      } else {
        console.log("❌ 未找到滚动锚点！");
      }
    };

    if (messages.length > 0) {
      setTimeout(scrollToNewestMessage, 100);
    }
  }, [messages]);

  /**
   * 处理当左侧边栏未被包含时 `updateSidebar` 事件的副作用
   */
  useEffect(() => {
    if (!config.includeLeftSidebar) {
      // 如果未包含左侧边栏，我们需要以不同方式处理 'updateSidebar' 事件
      const handleUpdateSidebar = (event: CustomEvent<ThinkingContent>) => {
        console.log("左侧边栏未包含。事件数据：", event.detail);
        // 当左侧边栏不存在时，您可能需要以不同方式处理此数据
      };

      window.addEventListener(
        "updateSidebar" as any,
        handleUpdateSidebar as EventListener,
      );
      return () =>
        window.removeEventListener(
          "updateSidebar" as any,
          handleUpdateSidebar as EventListener,
        );
    }
  }, []);

  /**
   * 处理当右侧边栏未被包含时 `updateRagSources` 事件的副作用
   */
  useEffect(() => {
    if (!config.includeRightSidebar) {
      // 如果未包含右侧边栏，我们需要以不同方式处理 'updateRagSources' 事件
      const handleUpdateRagSources = (event: CustomEvent) => {
        console.log("右侧边栏未包含。RAG源：", event.detail);
        // 当右侧边栏不存在时，您可能需要以不同方式处理此数据
      };

      window.addEventListener(
        "updateRagSources" as any,
        handleUpdateRagSources as EventListener,
      );
      return () =>
        window.removeEventListener(
          "updateRagSources" as any,
          handleUpdateRagSources as EventListener,
        );
    }
  }, []);

  /**
   * 解码并打印来自响应头的调试数据
   * @param {Response} response - fetch响应对象
   */
  const decodeDebugData = (response: Response) => {
    const debugData = response.headers.get("X-Debug-Data");
    if (debugData) {
      try {
        const parsed = JSON.parse(debugData);
        console.log("🔍 服务器调试：", parsed.msg, parsed.data);
      } catch (e) {
        console.error("调试数据解码失败：", e);
      }
    }
  };

  /**
   * 记录操作的持续时间
   * @param {string} label - 计时标签
   * @param {number} duration - 持续时间（毫秒）
   */
  const logDuration = (label: string, duration: number) => {
    console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
  };

  /**
   * 处理消息提交事件（发送到API）
   * @param {React.FormEvent<HTMLFormElement> | string} event - 表单事件或字符串类型的建议问题
   */
  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement> | string,
  ) => {
    if (typeof event !== "string") {
      event.preventDefault();
    }
    if (!showHeader) setShowHeader(true);
    if (!showAvatar) setShowAvatar(true);
    setIsLoading(true);

    const clientStart = performance.now();
    console.log("🔄 开始请求：" + new Date().toISOString());

    const userMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: typeof event === "string" ? event : input,
    };

    // 为AI响应创建一个占位符消息
    const placeholderMessage = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: JSON.stringify({
        response: "",
        thinking: "AI正在处理中...",
        user_mood: "neutral",
        debug: {
          context_used: false,
        },
      }),
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      userMessage,
      placeholderMessage,
    ]);
    setInput("");

    const placeholderDisplayed = performance.now();
    logDuration("感知延迟", placeholderDisplayed - clientStart);

    try {
      console.log("➡️ 发送消息到API：", userMessage.content);
      const startTime = performance.now();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          model: selectedModel,
          knowledgeBaseId: selectedKnowledgeBase,
        }),
      });

      const responseReceived = performance.now();
      logDuration("完整往返", responseReceived - startTime);
      logDuration("网络耗时", responseReceived - startTime);

      decodeDebugData(response);

      if (!response.ok) {
        throw new Error(`API请求失败，状态码：${response.status}`);
      }

      const data = await response.json();
      const endTime = performance.now();
      logDuration("JSON解析耗时", endTime - responseReceived);
      logDuration("总API耗时", endTime - startTime);
      console.log("⬅️ 从API接收到响应：", data);

      const suggestedQuestionsHeader = response.headers.get(
        "x-suggested-questions",
      );
      if (suggestedQuestionsHeader) {
        data.suggested_questions = JSON.parse(suggestedQuestionsHeader);
      }

      const ragHeader = response.headers.get("x-rag-sources");
      if (ragHeader) {
        const ragProcessed = performance.now();
        logDuration(
          "🔍 RAG处理耗时",
          ragProcessed - responseReceived,
        );
        const sources = JSON.parse(ragHeader);
        window.dispatchEvent(
          new CustomEvent("updateRagSources", {
            detail: {
              sources,
              query: userMessage.content,
              debug: data.debug,
            },
          }),
        );
      }

      const readyToRender = performance.now();
      logDuration("响应处理耗时", readyToRender - responseReceived);

      // 更新消息列表，用真实的AI响应替换占位符
      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        const lastIndex = newMessages.length - 1;
        newMessages[lastIndex] = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: JSON.stringify(data),
        };
        return newMessages;
      });

      // 触发事件以更新侧边栏
      const sidebarEvent = new CustomEvent("updateSidebar", {
        detail: {
          id: data.id,
          content: data.thinking?.trim(),
          user_mood: data.user_mood,
          debug: data.debug,
          matched_categories: data.matched_categories,
        },
      });
      window.dispatchEvent(sidebarEvent);

      // 如果需要，触发转接人工客服的事件
      if (data.redirect_to_agent && data.redirect_to_agent.should_redirect) {
        window.dispatchEvent(
          new CustomEvent("agentRedirectRequested", {
            detail: data.redirect_to_agent,
          }),
        );
      }
    } catch (error) {
      console.error("获取聊天响应时出错：", error);
      console.error("处理消息失败：", userMessage.content);
    } finally {
      setIsLoading(false);
      const clientEnd = performance.now();
      logDuration("总客户端操作耗时", clientEnd - clientStart);
    }
  };

  /**
   * 处理键盘按下事件，实现Enter键发送消息
   * @param {React.KeyboardEvent<HTMLTextAreaElement>} e - 键盘事件对象
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() !== "") {
        handleSubmit(e as any);
      }
    }
  };

  /**
   * 处理输入框内容变化事件，并动态调整文本域高度
   * @param {React.ChangeEvent<HTMLTextAreaElement>} event - 输入框变化事件对象
   */
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    setInput(textarea.value);

    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 300)}px`;
  };

  /**
   * 处理建议问题的点击事件
   * @param {string} question - 被点击的建议问题
   */
  const handleSuggestedQuestionClick = (question: string) => {
    handleSubmit(question);
  };

  /**
   * 设置一个副作用钩子来监听工具执行事件
   */
  useEffect(() => {
    const handleToolExecution = (event: Event) => {
      const customEvent = event as CustomEvent<{
        ui: { type: string; props: any };
      }>;
      console.log("接收到工具执行事件：", customEvent.detail);
    };

    window.addEventListener("toolExecution", handleToolExecution);
    return () =>
      window.removeEventListener("toolExecution", handleToolExecution);
  }, []);

  return (
    <Card className="flex-1 flex flex-col mb-4 mr-4 ml-4">
      <CardContent className="flex-1 flex flex-col overflow-hidden pt-4 px-4 pb-0">
        <ConversationHeader
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          models={models}
          showAvatar={showAvatar}
          selectedKnowledgeBase={selectedKnowledgeBase}
          setSelectedKnowledgeBase={setSelectedKnowledgeBase}
          knowledgeBases={knowledgeBases}
        />
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full animate-fade-in-up">
              <Avatar className="w-10 h-10 mb-4 border">
                <AvatarImage
                  src="/ant-logo.svg"
                  alt="AI Assistant Avatar"
                  width={40}
                  height={40}
                />
              </Avatar>
              <h2 className="text-2xl font-semibold mb-8">
                我能为您做些什么
              </h2>
              <div className="space-y-4 text-sm">
                <div className="flex items-center gap-3">
                  <HandHelping className="text-muted-foreground" />
                  <p className="text-muted-foreground">
                    需要指导吗？我将使用内部资源帮助您完成任务。
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <WandSparkles className="text-muted-foreground" />
                  <p className="text-muted-foreground">
                    我是信息查找高手！我可以深入挖掘您的知识库。
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <BookOpenText className="text-muted-foreground" />
                  <p className="text-muted-foreground">
                    我总是在学习！您分享得越多，我就能更好地帮助您。
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div key={message.id}>
                  <div
                    className={`flex items-start ${
                      message.role === "user" ? "justify-end" : ""
                    } ${
                      index === messages.length - 1 ? "animate-fade-in-up" : ""
                    }`}
                    style={{
                      animationDuration: "300ms",
                      animationFillMode: "backwards",
                    }}
                  >
                    {message.role === "assistant" && (
                      <Avatar className="w-8 h-8 mr-2 border">
                        <AvatarImage
                          src="/ant-logo.svg"
                          alt="AI助手头像"
                        />
                        <AvatarFallback>AI</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`p-3 rounded-md text-sm max-w-[65%] ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted border"
                      }`}
                    >
                      <MessageContent
                        content={message.content}
                        role={message.role}
                      />
                    </div>
                  </div>
                  {message.role === "assistant" && (
                    <SuggestedQuestions
                      questions={
                        JSON.parse(message.content).suggested_questions || []
                      }
                      onQuestionClick={handleSuggestedQuestionClick}
                      isLoading={isLoading}
                    />
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} style={{ height: "1px" }} />
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col w-full relative bg-background border rounded-xl focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        >
          <Textarea
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="输入您的消息..."
            disabled={isLoading}
            className="resize-none min-h-[44px] bg-background  border-0 p-3 rounded-xl shadow-none focus-visible:ring-0"
            rows={1}
          />
          <div className="flex justify-between items-center p-3">
            <div>
              <Image
                src="/claude-icon.svg"
                alt="Claude Icon"
                width={0}
                height={14}
                className="w-auto h-[14px] mt-1"
              />
            </div>
            <Button
              type="submit"
              disabled={isLoading || input.trim() === ""}
              className="gap-2"
              size="sm"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-t-2 border-white rounded-full" />
              ) : (
                <>
                  发送消息
                  <Send className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </CardFooter>
    </Card>
  );
}

export default ChatArea;

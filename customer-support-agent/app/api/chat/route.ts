/**
 * 聊天API路由处理器
 * 处理客户支持聊天请求，集成Anthropic Claude AI和AWS Bedrock RAG功能
 */

import customerSupportCategories from "@/app/lib/customer_support_categories.json";
import { RAGSource, retrieveContext } from "@/app/lib/utils";
import Anthropic from "@anthropic-ai/sdk";
import crypto from "crypto";
import { z } from "zod";

/**
 * Anthropic客户端实例
 * 用于与Claude AI模型进行交互
 */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * 调试消息辅助函数
 * 生成包含消息、清理后的数据和时间的JSON字符串
 *
 * @param msg - 调试消息
 * @param data - 可选的调试数据对象
 * @returns 格式化的调试信息JSON字符串
 */
const debugMessage = (msg: string, data: any = {}) => {
  console.log(msg, data);
  const timestamp = new Date().toISOString().replace(/[^\x20-\x7E]/g, "");
  const safeData = JSON.parse(JSON.stringify(data));
  return JSON.stringify({ msg, data: safeData, timestamp });
};

/**
 * AI响应数据结构模式
 * 使用Zod进行类型安全和验证，确保AI输出的格式正确
 *
 * @remarks
 * 该模式定义了AI响应必须包含的字段及其类型验证规则
 */
const responseSchema = z.object({
  /** AI对用户的主要回复内容 */
  response: z.string(),
  /** AI的思考过程说明 */
  thinking: z.string(),
  /** 检测到的用户情绪状态 */
  user_mood: z.enum([
    "positive",
    "neutral",
    "negative",
    "curious",
    "frustrated",
    "confused",
  ]),
  /** 建议的后续问题列表 */
  suggested_questions: z.array(z.string()),
  /** 调试信息 */
  debug: z.object({
    /** 是否使用了检索到的上下文 */
    context_used: z.boolean(),
  }),
  /** 匹配到的客户支持分类（可选） */
  matched_categories: z.array(z.string()).optional(),
  /** 是否需要转接到人工客服（可选） */
  redirect_to_agent: z
    .object({
      /** 是否应该转接 */
      should_redirect: z.boolean(),
      /** 转接原因（可选） */
      reason: z.string().optional(),
    })
    .optional(),
});

/**
 * HTTP头值清理函数
 * 移除非ASCII字符，确保HTTP头值的安全性
 *
 * @param value - 要清理的字符串值
 * @returns 清理后的ASCII字符串
 */
function sanitizeHeaderValue(value: string): string {
  return value.replace(/[^\x00-\x7F]/g, "");
}

/**
 * 性能测量辅助函数
 * 记录操作耗时并输出到控制台
 *
 * @param label - 操作标签
 * @param start - 开始时间戳（performance.now()）
 */
const logTimestamp = (label: string, start: number) => {
  const timestamp = new Date().toISOString();
  const time = ((performance.now() - start) / 1000).toFixed(2);
  console.log(`⏱️ [${timestamp}] ${label}: ${time}s`);
};

/**
 * 主要的POST请求处理器
 * 处理聊天消息，集成RAG检索和AI响应生成
 *
 * @param req - HTTP请求对象
 * @returns 包含AI响应的HTTP响应
 */
export async function POST(req: Request) {
  const apiStart = performance.now();
  const measureTime = (label: string) => logTimestamp(label, apiStart);

  // 从请求体中提取数据
  const { messages, model, knowledgeBaseId } = await req.json();
  const latestMessage = messages[messages.length - 1].content;

  console.log("📝 Latest Query:", latestMessage);
  measureTime("User Input Received");

  // 准备调试数据
  const MAX_DEBUG_LENGTH = 1000;
  const debugData = sanitizeHeaderValue(
    debugMessage("🚀 API route called", {
      messagesReceived: messages.length,
      latestMessageLength: latestMessage.length,
      anthropicKeySlice: process.env.ANTHROPIC_API_KEY?.slice(0, 4) + "****",
    }),
  ).slice(0, MAX_DEBUG_LENGTH);

  // 初始化RAG检索变量
  let retrievedContext = "";
  let isRagWorking = false;
  let ragSources: RAGSource[] = [];

  // 尝试从RAG检索上下文
  try {
    console.log("🔍 Initiating RAG retrieval for query:", latestMessage);
    measureTime("RAG Start");
    const result = await retrieveContext(latestMessage, knowledgeBaseId);
    retrievedContext = result.context;
    isRagWorking = result.isRagWorking;
    ragSources = result.ragSources || [];

    if (!result.isRagWorking) {
      console.warn("🚨 RAG Retrieval failed but did not throw!");
    }

    measureTime("RAG Complete");
    console.log("🔍 RAG Retrieved:", isRagWorking ? "YES" : "NO");
    console.log(
      "✅ RAG retrieval completed successfully. Context:",
      retrievedContext.slice(0, 100) + "...",
    );
  } catch (error) {
    console.error("💀 RAG Error:", error);
    console.error("❌ RAG retrieval failed for query:", latestMessage);
    retrievedContext = "";
    isRagWorking = false;
    ragSources = [];
  }

  measureTime("RAG Total Duration");

  // 为系统提示准备分类上下文
  const USE_CATEGORIES = true;
  const categoryListString = customerSupportCategories.categories
    .map((c) => c.id)
    .join(", ");

  const categoriesContext = USE_CATEGORIES
    ? `
    为了帮助我们内部对咨询进行分类，我们希望您在回答问题的同时对咨询进行分类。我们为您提供了${customerSupportCategories.categories.length}个客户支持分类。
    检查您的回复是否适合任何分类，并在"matched_categories"数组中包含分类ID。
    可用的分类有：${categoryListString}
    如果匹配多个分类，请包含多个分类ID。如果没有分类匹配，请返回空数组。
  `
    : "";

  // 根据您的用例更改系统提示中的公司名称
  const systemPrompt = `您是一个Anthropic客户支持助手聊天机器人，在网站的聊天窗口中工作。您正在与询问Anthropic产品和服务帮助的人工用户聊天。在回复用户时，力求提供简洁有用的回复，同时保持礼貌和专业的语调。

  为了帮助您回答用户的问题，我们为您检索了以下信息。它可能与问题相关，也可能不相关（我们使用RAG管道来检索此信息）：
  ${isRagWorking ? `${retrievedContext}` : "未找到此查询的相关信息。"}

  请仅使用您获得的信息提供回复。如果没有可用信息，或者信息与回答问题无关，您可以将用户转接给人工客服以获得进一步帮助。

  ${categoriesContext}

  如果问题与Anthropic的产品和服务无关，您应该将用户转接给人工客服。

  您是用户的第一联系人，应尝试解决他们的问题或提供相关信息。如果您无法帮助用户，或者用户明确要求与人工交谈，您可以将他们转接给人工客服以获得进一步帮助。

  为了正确显示您的回复，您必须将整个回复格式化为具有以下结构的有效JSON对象：
  {
      "thinking": "您对如何处理用户查询的推理的简要说明",
      "response": "您对用户的简洁回复",
      "user_mood": "positive|neutral|negative|curious|frustrated|confused",
      "suggested_questions": ["问题1？", "问题2？", "问题3？"],
      "debug": {
        "context_used": true|false
      },
      ${USE_CATEGORIES ? '"matched_categories": ["category_id1", "category_id2"],' : ""}
      "redirect_to_agent": {
        "should_redirect": boolean,
        "reason": "转接原因（可选，仅当should_redirect为true时包含）"
      }
    }

  以下是您的回复应该是什么样子的几个示例：

  无需转接到人工客服的回复示例：
  {
    "thinking": "从知识库提供相关信息",
    "response": "这是您请求的信息...",
    "user_mood": "curious",
    "suggested_questions": ["如何更新我的账户？", "有哪些付款选项？"],
    "debug": {
      "context_used": true
    },
    "matched_categories": ["account_management", "billing"],
    "redirect_to_agent": {
      "should_redirect": false
    }
  }

  需要转接到人工客服的回复示例：
  {
    "thinking": "用户请求需要人工干预",
    "response": "我理解这是一个复杂的问题。让我为您连接可以更好地帮助您的人工客服。",
    "user_mood": "frustrated",
    "suggested_questions": [],
    "debug": {
      "context_used": false
    },
    "matched_categories": ["technical_support"],
    "redirect_to_agent": {
      "should_redirect": true,
      "reason": "需要人工专业知识的复杂技术问题"
    }
  }
  `

  /**
   * JSON响应清理和解析函数
   * 处理AI响应中的换行符并安全解析JSON
   *
   * @param jsonString - 要解析的JSON字符串
   * @returns 解析后的JSON对象
   * @throws 当JSON解析失败时抛出错误
   */
  function sanitizeAndParseJSON(jsonString: string) {
    // 替换字符串值中的换行符
    const sanitized = jsonString.replace(/(?<=:\s*")(.|\n)*?(?=")/g, match =>
      match.replace(/\n/g, "\\n")
    );

    try {
      return JSON.parse(sanitized);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid JSON response from AI");
    }
  }

  try {
    console.log(`🚀 Query Processing`);
    measureTime("Claude Generation Start");

    // 准备消息数组供Anthropic API使用
    const anthropicMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 添加助手消息的开头，引导AI生成JSON格式的响应
    anthropicMessages.push({
      role: "assistant",
      content: "{",
    });

    // 调用Anthropic API生成响应
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: 1000,
      messages: anthropicMessages,
      system: systemPrompt,
      temperature: 0.3,
    });

    measureTime("Claude Generation Complete");
    console.log("✅ Message generation completed");

    // 从响应中提取文本内容
    const textContent = "{" + response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join(" ");

    // 解析JSON响应
    let parsedResponse;
    try {
      parsedResponse = sanitizeAndParseJSON(textContent);
    } catch (parseError) {
      console.error("Error parsing JSON response:", parseError);
      throw new Error("Invalid JSON response from AI");
    }

    // 验证响应数据格式
    const validatedResponse = responseSchema.parse(parsedResponse);

    // 为响应添加唯一ID
    const responseWithId = {
      id: crypto.randomUUID(),
      ...validatedResponse,
    };

    // 检查是否需要转接到人工客服
    if (responseWithId.redirect_to_agent?.should_redirect) {
      console.log("🚨 AGENT REDIRECT TRIGGERED!");
      console.log("Reason:", responseWithId.redirect_to_agent.reason);
    }

    // 准备响应对象
    const apiResponse = new Response(JSON.stringify(responseWithId), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // 如果有RAG源数据，添加到响应头中
    if (ragSources.length > 0) {
      apiResponse.headers.set(
        "x-rag-sources",
        sanitizeHeaderValue(JSON.stringify(ragSources)),
      );
    }

    // 添加调试数据到响应头
    apiResponse.headers.set("X-Debug-Data", sanitizeHeaderValue(debugData));

    measureTime("API Complete");

    return apiResponse;
  } catch (error) {
    // 处理AI响应生成中的错误
    console.error("💥 Error in message generation:", error);
    const errorResponse = {
      response:
        "抱歉，处理您的请求时出现了问题。请稍后再试。",
      thinking: "消息生成过程中发生错误。",
      user_mood: "neutral",
      debug: { context_used: false },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * 应用工具函数库
 * 提供AWS Bedrock RAG检索功能和CSS类名合并功能
 */

import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
  RetrieveCommandInput,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// 检查AWS凭证是否配置
console.log("🔑 Have AWS AccessKey?", !!process.env.BAWS_ACCESS_KEY_ID);
console.log("🔑 Have AWS Secret?", !!process.env.BAWS_SECRET_ACCESS_KEY);

/**
 * AWS Bedrock Agent Runtime客户端
 * 用于与AWS Bedrock知识库进行交互
 */
const bedrockClient = new BedrockAgentRuntimeClient({
  region: "us-east-1", // 确保此区域与您的Bedrock区域匹配
  credentials: {
    accessKeyId: process.env.BAWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BAWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * 合并 Tailwind CSS 类名的工具函数
 * 使用 clsx 和 tailwind-merge 来智能合并 CSS 类名，避免冲突
 * 
 * @param inputs - 要合并的类名数组，可以是字符串、对象或数组形式
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * RAG（检索增强生成）源数据结构
 * 表示从知识库检索到的文档片段信息
 */
export interface RAGSource {
  /** 文档片段的唯一标识符 */
  id: string;
  /** 源文件名 */
  fileName: string;
  /** 文档内容片段 */
  snippet: string;
  /** 相关性评分（数值越高表示与查询越相关） */
  score: number;
}

/**
 * 从AWS Bedrock知识库检索相关上下文信息
 * 使用RAG（检索增强生成）技术获取与查询相关的文档片段
 * 
 * @param query - 用户查询字符串
 * @param knowledgeBaseId - AWS Bedrock知识库ID
 * @param n - 要检索的结果数量，默认为3
 * @returns 返回包含上下文、RAG状态和源数据的对象
 * 
 * @example
 * const result = await retrieveContext("如何重置密码？", "kb-123456", 5);
 * console.log(result.context); // 检索到的上下文内容
 * console.log(result.isRagWorking); // RAG是否正常工作
 * console.log(result.ragSources); // 检索到的源数据
 */
export async function retrieveContext(
  query: string,
  knowledgeBaseId: string,
  n: number = 3,
): Promise<{
  /** 检索到的上下文内容 */
  context: string;
  /** RAG功能是否正常工作 */
  isRagWorking: boolean;
  /** 检索到的RAG源数据数组 */
  ragSources: RAGSource[];
}> {
  try {
    // 验证知识库ID是否提供
    if (!knowledgeBaseId) {
      console.error("knowledgeBaseId is not provided");
      return {
        context: "",
        isRagWorking: false,
        ragSources: [],
      };
    }

    // 构建检索请求参数
    const input: RetrieveCommandInput = {
      knowledgeBaseId: knowledgeBaseId,
      retrievalQuery: { text: query },
      retrievalConfiguration: {
        vectorSearchConfiguration: { numberOfResults: n },
      },
    };

    // 发送检索请求到AWS Bedrock
    const command = new RetrieveCommand(input);
    const response = await bedrockClient.send(command);

    // 解析检索结果
    const rawResults = response?.retrievalResults || [];
    
    // 将检索结果转换为RAGSource格式
    const ragSources: RAGSource[] = rawResults
      .filter((res: any) => res.content && res.content.text)
      .map((result: any, index: number) => {
        const uri = result?.location?.s3Location?.uri || "";
        const fileName = uri.split("/").pop() || `Source-${index}.txt`;

        return {
          id:
            result.metadata?.["x-amz-bedrock-kb-chunk-id"] || `chunk-${index}`,
          fileName: fileName.replace(/_/g, " ").replace(".txt", ""),
          snippet: result.content?.text || "",
          score: result.score || 0,
        };
      })
      .slice(0, 1); // 只取第一个最相关的结果

    console.log("🔍 Parsed RAG Sources:", ragSources); // 调试日志

    // 构建上下文字符串
    const context = rawResults
      .filter((res: any) => res.content && res.content.text)
      .map((res: any) => res.content.text)
      .join("\n\n");

    return {
      context,
      isRagWorking: true,
      ragSources,
    };
  } catch (error) {
    console.error("RAG Error:", error);
    return { context: "", isRagWorking: false, ragSources: [] };
  }
}
}

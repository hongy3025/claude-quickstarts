// app/api/finance/route.ts
/**
 * @file Next.js API 路由，用于处理金融数据分析和图表生成。
 *
 * 该路由接收包含消息、文件数据和模型选择的 POST 请求。
 * 它与 Anthropic API 交互，利用其函数调用（Tools）功能来生成结构化的图表数据。
 * 主要功能包括：
 * - 接收和验证用户输入（消息、文件）。
 * - 处理文件上传（文本和图片），将其内容整合到发送给 AI 的消息中。
 * - 调用 Anthropic API，并提供一个详细的系统提示，指导 AI 如何作为金融专家分析数据和使用工具。
 * - 定义一个 `generate_graph_data` 工具，使 AI 能够输出结构化的 JSON 数据用于图表渲染。
 * - 处理 AI 的响应，特别是工具使用（tool_use）的内容，将其转换为前端可用的图表配置。
 * - 对图表数据进行后处理，例如为饼图转换数据结构、为图表系列分配颜色。
 * - 强大的错误处理机制，能够捕获和响应 API 错误、认证错误等。
 */
import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { ChartData } from "@/types/chart";

/**
 * 使用从环境变量中获取的 API 密钥初始化 Anthropic 客户端。
 * @see https://github.com/anthropics/anthropic-sdk-typescript
 */
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

/**
 * 指定此 API 路由的运行时环境为 Edge。
 * 这有助于在靠近用户的地方执行代码，减少延迟。
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#runtime
 */
export const runtime = "edge";

/**
 * 验证一个字符串是否为有效的 Base64 编码。
 * @param str - 要验证的字符串。
 * @returns 如果字符串是有效的 Base64，则返回 true；否则返回 false。
 */
const isValidBase64 = (str: string) => {
  try {
    // 尝试解码后再编码，如果结果与原字符串相同，则是有效的 Base64
    return btoa(atob(str)) === str;
  } catch (err) {
    // 如果解码失败，说明不是有效的 Base64
    return false;
  }
};

/**
 * 扩展了 ChartData 类型，用于表示工具响应中的图表数据。
 * @interface
 */
interface ChartToolResponse extends ChartData {
  // 这里可以添加特定于工具响应的任何其他属性
}

/**
 * 定义了提供给 Anthropic API 的工具的结构。
 * @interface
 */
interface ToolSchema {
  /** 工具的名称 */
  name: string;
  /** 工具功能的描述 */
  description: string;
  /**
   * 定义工具输入参数的 JSON Schema。
   * @see https://docs.anthropic.com/claude/docs/tool-use
   */
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required: string[];
  };
}

/**
 * 定义了可供 Anthropic 模型使用的工具列表。
 * 目前只包含一个 `generate_graph_data` 工具，用于生成图表数据。
 * @type {ToolSchema[]}
 */
const tools: ToolSchema[] = [
  {
    name: "generate_graph_data",
    description:
      "生成用于创建金融图表和图形的结构化 JSON 数据。",
    input_schema: {
      type: "object" as const,
      properties: {
        chartType: {
          type: "string" as const,
          enum: [
            "bar",
            "multiBar",
            "line",
            "pie",
            "area",
            "stackedArea",
          ] as const,
          description: "要生成的图表类型",
        },
        config: {
          type: "object" as const,
          properties: {
            title: { type: "string" as const },
            description: { type: "string" as const },
            trend: {
              type: "object" as const,
              properties: {
                percentage: { type: "number" as const },
                direction: {
                  type: "string" as const,
                  enum: ["up", "down"] as const,
                },
              },
              required: ["percentage", "direction"],
            },
            footer: { type: "string" as const },
            totalLabel: { type: "string" as const },
            xAxisKey: { type: "string" as const },
          },
          required: ["title", "description"],
        },
        data: {
          type: "array" as const,
          items: {
            type: "object" as const,
            additionalProperties: true, // 允许任何结构
          },
        },
        chartConfig: {
          type: "object" as const,
          additionalProperties: {
            type: "object" as const,
            properties: {
              label: { type: "string" as const },
              stacked: { type: "boolean" as const },
            },
            required: ["label"],
          },
        },
      },
      required: ["chartType", "config", "data", "chartConfig"],
    },
  },
];

/**
 * 处理对 /api/finance 的 POST 请求。
 * @param req - Next.js 的请求对象。
 * @returns 返回一个包含 AI 回复或错误信息的响应。
 */
export async function POST(req: NextRequest) {
  try {
    const { messages, fileData, model } = await req.json();

    console.log("🔍 初始请求数据:", {
      hasMessages: !!messages,
      messageCount: messages?.length,
      hasFileData: !!fileData,
      fileType: fileData?.mediaType,
      model,
    });

    // 输入验证
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "必须提供消息数组" }),
        { status: 400 },
      );
    }

    if (!model) {
      return new Response(
        JSON.stringify({ error: "必须选择模型" }),
        { status: 400 },
      );
    }

    // 转换所有之前的消息为 Anthropic API 格式
    let anthropicMessages = messages.map((msg: any) => ({
      role: msg.role,
      content: msg.content,
    }));

    // 处理最新消息中的文件
    if (fileData) {
      const { base64, mediaType, isText } = fileData;

      if (!base64) {
        console.error("❌ 未收到 base64 数据");
        return new Response(JSON.stringify({ error: "无文件数据" }), {
          status: 400,
        });
      }

      try {
        if (isText) {
          // 解码 base64 文本内容
          const textContent = decodeURIComponent(escape(atob(base64)));

          // 将文件内容和原始消息合并到最后一条用户消息中
          anthropicMessages[anthropicMessages.length - 1] = {
            role: "user",
            content: [
              {
                type: "text",
                text: `文件 ${fileData.fileName} 的内容如下:\n\n${textContent}`,
              },
              {
                type: "text",
                text: messages[messages.length - 1].content,
              },
            ],
          };
        } else if (mediaType.startsWith("image/")) {
          // 处理图片文件
          anthropicMessages[anthropicMessages.length - 1] = {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: mediaType,
                  data: base64,
                },
              },
              {
                type: "text",
                text: messages[messages.length - 1].content,
              },
            ],
          };
        }
      } catch (error) {
        console.error("处理文件内容时出错:", error);
        return new Response(
          JSON.stringify({ error: "处理文件内容失败" }),
          { status: 400 },
        );
      }
    }

    console.log("🚀 最终发送给 Claude API 的请求:", {
      endpoint: "messages.create",
      model,
      max_tokens: 4096,
      temperature: 0.7,
      messageCount: anthropicMessages.length,
      tools: tools.map((t) => t.name),
      messageStructure: JSON.stringify(
        anthropicMessages.map((msg) => ({
          role: msg.role,
          content:
            typeof msg.content === "string"
              ? msg.content.slice(0, 50) + "..."
              : "[复杂内容]",
        })),
        null,
        2,
      ),
    });

    const response = await anthropic.messages.create({
      model,
      max_tokens: 4096,
      temperature: 0.7,
      tools: tools,
      tool_choice: { type: "auto" },
      messages: anthropicMessages,
      system: `你是一位金融数据可视化专家。你的职责是分析金融数据，并使用 generate_graph_data 工具创建清晰、有意义的可视化图表。

以下是可用的图表类型及其理想用例：

1. 折线图 ("line")
   - 显示趋势的时间序列数据
   - 随时间变化的金融指标
   - 市场表现跟踪

2. 柱状图 ("bar")
   - 单一指标的比较
   - 周期性分析
   - 类别表现

3. 多重柱状图 ("multiBar")
   - 多个指标的比较
   - 并排的性能分析
   - 跨类别洞察

4. 面积图 ("area")
   - 随时间变化的数量或总量
   - 累积趋势
   - 市场规模演变

5. 堆叠面积图 ("stackedArea")
   - 随时间变化的组成部分分析
   - 投资组合构成变化
   - 市场份额演变

6. 饼图 ("pie")
   - 分布分析
   - 市场份额细分
   - 投资组合配置

在生成可视化时：
1. 根据图表类型正确构建数据结构
2. 使用描述性的标题和清晰的说明
3. 在相关时包含趋势信息（百分比和方向）
4. 添加上下文页脚注释
5. 使用能反映实际指标的正确数据键

数据结构示例：

对于时间序列 (折线图/柱状图/面积图):
{
  data: [
    { period: "2024年第一季度", revenue: 1250000 },
    { period: "2024年第二季度", revenue: 1450000 }
  ],
  config: {
    xAxisKey: "period",
    title: "季度收入",
    description: "收入随时间增长情况"
  },
  chartConfig: {
    revenue: { label: "收入 ($)" }
  }
}

对于比较 (多重柱状图):
{
  data: [
    { category: "产品 A", sales: 450000, costs: 280000 },
    { category: "产品 B", sales: 650000, costs: 420000 }
  ],
  config: {
    xAxisKey: "category",
    title: "产品表现",
    description: "按产品划分的销售额与成本"
  },
  chartConfig: {
    sales: { label: "销售额 ($)" },
    costs: { label: "成本 ($)" }
  }
}

对于分布 (饼图):
{
  data: [
    { segment: "股票", value: 5500000 },
    { segment: "债券", value: 3200000 }
  ],
  config: {
    xAxisKey: "segment",
    title: "投资组合配置",
    description: "当前投资分布",
    totalLabel: "总资产"
  },
  chartConfig: {
    equities: { label: "股票" },
    bonds: { label: "债券" }
  }
}

永远记住：
- 生成真实、符合上下文的数据
- 使用正确的金融格式
- 包含相关的趋势和洞察
- 完全按照所选图表类型所需的数据结构来组织数据
- 为数据选择最合适的可视化方式

绝不：
- 使用占位符或静态数据
- 声明你正在使用工具
- 在回复中包含技术实现细节
- 绝不说你正在使用 generate_graph_data 工具，只在需要时执行它。

专注于清晰的金融洞察，让可视化增强理解。`,
    });

    console.log("✅ 收到 Claude API 响应:", {
      status: "成功",
      stopReason: response.stop_reason,
      hasToolUse: response.content.some((c) => c.type === "tool_use"),
      contentTypes: response.content.map((c) => c.type),
      contentLength:
        response.content[0].type === "text"
          ? response.content[0].text.length
          : 0,
      toolOutput: response.content.find((c) => c.type === "tool_use")
        ? JSON.stringify(
            response.content.find((c) => c.type === "tool_use"),
            null,
            2,
          )
        : "未使用工具",
    });

    const toolUseContent = response.content.find((c) => c.type === "tool_use");
    const textContent = response.content.find((c) => c.type === "text");

    /**
     * 处理和转换来自 AI 工具的响应数据。
     * @param toolUseContent - AI 响应中的 tool_use 部分。
     * @returns 经过处理和验证的图表数据，如果内容无效则返回 null。
     * @throws 如果图表数据结构无效，则抛出错误。
     */
    const processToolResponse = (toolUseContent: any) => {
      if (!toolUseContent) return null;

      const chartData = toolUseContent.input as ChartToolResponse;

      if (
        !chartData.chartType ||
        !chartData.data ||
        !Array.isArray(chartData.data)
      ) {
        throw new Error("无效的图表数据结构");
      }

      // 为饼图转换数据以匹配预期的结构
      if (chartData.chartType === "pie") {
        // 确保数据项具有 'segment' 和 'value' 键
        chartData.data = chartData.data.map((item) => {
          // 找到 chartConfig 中的第一个键 (例如, 'sales')
          const valueKey = Object.keys(chartData.chartConfig)[0];
          const segmentKey = chartData.config.xAxisKey || "segment";

          return {
            segment:
              item[segmentKey] || item.segment || item.category || item.name,
            value: item[valueKey] || item.value,
          };
        });

        // 为保持一致性，确保 xAxisKey 设置为 'segment'
        chartData.config.xAxisKey = "segment";
      }

      // 创建新的 chartConfig，并使用系统颜色变量
      const processedChartConfig = Object.entries(chartData.chartConfig).reduce(
        (acc, [key, config], index) => ({
          ...acc,
          [key]: {
            ...config,
            // 依次分配颜色变量
            color: `hsl(var(--chart-${index + 1}))`,
          },
        }),
        {},
      );

      return {
        ...chartData,
        chartConfig: processedChartConfig,
      };
    };

    const processedChartData = toolUseContent
      ? processToolResponse(toolUseContent)
      : null;

    return new Response(
      JSON.stringify({
        content: textContent?.text || "",
        hasToolUse: response.content.some((c) => c.type === "tool_use"),
        toolUse: toolUseContent,
        chartData: processedChartData,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      },
    );
  } catch (error) {
    console.error("❌ Finance API 错误: ", error);
    console.error("完整错误详情:", {
      name: error instanceof Error ? error.name : "未知",
      message: error instanceof Error ? error.message : "未知错误",
      stack: error instanceof Error ? error.stack : undefined,
      headers: error instanceof Error ? (error as any).headers : undefined,
      response: error instanceof Error ? (error as any).response : undefined,
    });

    // 为不同场景添加特定的错误处理
    if (error instanceof Anthropic.APIError) {
      return new Response(
        JSON.stringify({
          error: "API 错误",
          details: error.message,
          code: error.status,
        }),
        { status: error.status },
      );
    }

    if (error instanceof Anthropic.AuthenticationError) {
      return new Response(
        JSON.stringify({
          error: "认证错误",
          details: "无效的 API 密钥或认证失败",
        }),
        { status: 401 },
      );
    }

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "发生未知错误",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

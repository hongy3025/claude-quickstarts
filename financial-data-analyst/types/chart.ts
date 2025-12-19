/**
 * @file 图表数据类型定义
 *
 * 定义了应用程序中使用的图表配置和数据的结构。
 */

/**
 * 图表配置项
 * 用于定义图表中每个数据系列的显示属性
 */
export interface ChartConfig {
  [key: string]: {
    /** 数据系列的标签名称 */
    label: string;
    /** 是否堆叠显示（适用于面积图等） */
    stacked?: boolean;
    /** 系列的颜色值 */
    color?: string;
  };
}

/**
 * 完整的图表数据结构
 * 包含图表类型、通用配置、实际数据和系列配置
 */
export interface ChartData {
  /** 图表类型 */
  chartType: "bar" | "multiBar" | "line" | "pie" | "area" | "stackedArea";
  /** 通用配置信息 */
  config: {
    /** 图表标题 */
    title: string;
    /** 图表详细描述 */
    description: string;
    /** 趋势分析数据 */
    trend?: {
      /** 增长/下降的百分比 */
      percentage: number;
      /** 趋势方向：增长 (up) 或 下降 (down) */
      direction: "up" | "down";
    };
    /** 页脚补充说明 */
    footer?: string;
    /** 总计标签（通常用于饼图中心） */
    totalLabel?: string;
    /** X 轴对应的键名 */
    xAxisKey?: string;
  };
  /** 实际的数据点数组 */
  data: Array<Record<string, any>>;
  /** 数据系列的具体配置 */
  chartConfig: ChartConfig;
}

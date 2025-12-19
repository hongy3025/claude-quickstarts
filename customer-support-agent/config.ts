/**
 * 应用配置文件
 * 定义了应用的全局配置选项
 */

/**
 * 应用配置类型定义
 * 定义了应用配置的结构
 */
type Config = {
  /** 是否包含左侧边栏 */
  includeLeftSidebar: boolean;
  /** 是否包含右侧边栏 */
  includeRightSidebar: boolean;
};

/**
 * 应用配置对象
 * 从环境变量读取配置，控制应用的UI组件显示
 *
 * @remarks
 * - includeLeftSidebar: 通过 NEXT_PUBLIC_INCLUDE_LEFT_SIDEBAR 环境变量控制
 * - includeRightSidebar: 通过 NEXT_PUBLIC_INCLUDE_RIGHT_SIDEBAR 环境变量控制
 *
 * @example
 * // 在 .env.local 文件中设置：
 * // NEXT_PUBLIC_INCLUDE_LEFT_SIDEBAR=true
 * // NEXT_PUBLIC_INCLUDE_RIGHT_SIDEBAR=false
 */
const config: Config = {
  includeLeftSidebar: process.env.NEXT_PUBLIC_INCLUDE_LEFT_SIDEBAR === "true",
  includeRightSidebar: process.env.NEXT_PUBLIC_INCLUDE_RIGHT_SIDEBAR === "true",
};

export default config;

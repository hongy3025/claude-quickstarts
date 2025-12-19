/**
 * 工具函数库
 * 提供项目中常用的工具函数
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名的工具函数
 * 使用 clsx 和 tailwind-merge 来智能合并 CSS 类名，避免冲突
 *
 * @param inputs - 要合并的类名数组，可以是字符串、对象或数组形式
 * @returns 合并后的类名字符串
 *
 * @example
 * cn("px-2", "py-1") // 返回: "px-2 py-1"
 * cn("px-2", { "py-1": true }) // 返回: "px-2 py-1"
 * cn("px-2", ["py-1", "bg-red-500"]) // 返回: "px-2 py-1 bg-red-500"
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

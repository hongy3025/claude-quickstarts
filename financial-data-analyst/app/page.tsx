/**
 * @file 首页入口文件
 * 
 * 该文件作为应用程序的默认入口点，目前直接重定向/渲染金融页面组件。
 */
"use client";

import React from "react";
import FinancePage from "./finance/page";

/**
 * 根页面组件
 * 渲染主金融分析页面
 */
export default function Home() {
  return <FinancePage />;
}

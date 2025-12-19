/**
 * @file Tailwind CSS 配置文件
 * 
 * 该文件定义了项目的样式主题，包括颜色方案、边框半径、动画以及响应式设计。
 * 颜色值大多映射到 CSS 变量，以便于主题切换（深色/浅色模式）。
 */
import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"], // 启用基于 class 的深色模式
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))', // 页面背景色
  			foreground: 'hsl(var(--foreground))', // 页面前景色（文字颜色）
  			card: {
  				DEFAULT: 'hsl(var(--card))', // 卡片背景色
  				foreground: 'hsl(var(--card-foreground))' // 卡片文字颜色
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))', // 弹出层背景色
  				foreground: 'hsl(var(--popover-foreground))' // 弹出层文字颜色
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))', // 主色调
  				foreground: 'hsl(var(--primary-foreground))' // 主色调文字颜色
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))', // 次要色调
  				foreground: 'hsl(var(--secondary-foreground))' // 次要色调文字颜色
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))', // 柔和色调（用于辅助信息）
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))', // 强调色
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))', // 破坏性动作颜色（如删除按钮）
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))', // 边框颜色
  			input: 'hsl(var(--input))', // 输入框边框颜色
  			ring: 'hsl(var(--ring))', // 焦点环颜色
  			chart: {
  				'1': 'hsl(var(--chart-1))', // 图表颜色序列
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)', // 大圆角
  			md: 'calc(var(--radius) - 2px)', // 中圆角
  			sm: 'calc(var(--radius) - 4px)' // 小圆角
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")], // 引入 tailwindcss-animate 插件
};
export default config;

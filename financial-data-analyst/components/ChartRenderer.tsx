/**
 * @file 图表渲染器组件
 * 
 * 该文件包含了多种基于 Recharts 的金融数据可视化图表组件。
 * 支持的图表类型包括：
 * - 柱状图 (Bar Chart)
 * - 多重柱状图 (Multi-Bar Chart)
 * - 折线图 (Line Chart)
 * - 饼图 (Pie Chart)
 * - 面积图 (Area Chart)
 * - 堆叠面积图 (Stacked Area Chart)
 */
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Label,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartData } from "@/types/chart";

/**
 * 柱状图组件
 * @param props.data - 图表配置和数据
 */
function BarChartComponent({ data }: { data: ChartData }) {
  const dataKey = Object.keys(data.chartConfig)[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={data.chartConfig}>
          <BarChart accessibilityLayer data={data.data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={data.config.xAxisKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return value.length > 20
                  ? `${value.substring(0, 17)}...`
                  : value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey={dataKey}
              fill={`var(--color-${dataKey})`}
              radius={8}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {data.config.trend && (
          <div className="flex gap-2 font-medium leading-none">
            本周期 {data.config.trend.direction === "up" ? "增长" : "下降"}{" "}
            {data.config.trend.percentage}%{" "}
            {data.config.trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
        {data.config.footer && (
          <div className="leading-none text-muted-foreground">
            {data.config.footer}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * 多重柱状图组件
 * @param props.data - 图表配置和数据
 */
function MultiBarChartComponent({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={data.chartConfig}>
          <BarChart accessibilityLayer data={data.data}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={data.config.xAxisKey}
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return value.length > 20
                  ? `${value.substring(0, 17)}...`
                  : value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            {Object.keys(data.chartConfig).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                fill={`var(--color-${key})`}
                radius={4}
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {data.config.trend && (
          <div className="flex gap-2 font-medium leading-none">
            本周期 {data.config.trend.direction === "up" ? "增长" : "下降"}{" "}
            {data.config.trend.percentage}%{" "}
            {data.config.trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
        {data.config.footer && (
          <div className="leading-none text-muted-foreground">
            {data.config.footer}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * 折线图组件
 * @param props.data - 图表配置和数据
 */
function LineChartComponent({ data }: { data: ChartData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={data.chartConfig}>
          <LineChart
            accessibilityLayer
            data={data.data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={data.config.xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                return value.length > 20
                  ? `${value.substring(0, 17)}...`
                  : value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            {Object.keys(data.chartConfig).map((key) => (
              <Line
                key={key}
                type="natural"
                dataKey={key}
                stroke={`var(--color-${key})`}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        {data.config.trend && (
          <div className="flex gap-2 font-medium leading-none">
            本周期 {data.config.trend.direction === "up" ? "增长" : "下降"}{" "}
            {data.config.trend.percentage}%{" "}
            {data.config.trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
        {data.config.footer && (
          <div className="leading-none text-muted-foreground">
            {data.config.footer}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * 饼图组件
 * @param props.data - 图表配置和数据
 */
function PieChartComponent({ data }: { data: ChartData }) {
  const totalValue = React.useMemo(() => {
    return data.data.reduce((acc, curr) => acc + curr.value, 0);
  }, [data.data]);

  const chartData = data.data.map((item, index) => {
    return {
      ...item,
      // 使用与其他图表相同的颜色变量模式
      fill: `hsl(var(--chart-${index + 1}))`,
    };
  });

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={data.chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="segment"
              innerRadius={60}
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalValue.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                          className="fill-muted-foreground"
                        >
                          {data.config.totalLabel}
                        </tspan>
                      </text>
                    );
                  }
                  return null;
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        {data.config.trend && (
          <div className="flex items-center gap-2 font-medium leading-none">
            本周期 {data.config.trend.direction === "up" ? "增长" : "下降"}{" "}
            {data.config.trend.percentage}%{" "}
            {data.config.trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
          </div>
        )}
        {data.config.footer && (
          <div className="leading-none text-muted-foreground">
            {data.config.footer}
          </div>
        )}
      </CardFooter>
    </Card>
  );
}

/**
 * 面积图组件（支持普通和堆叠模式）
 * @param props.data - 图表配置和数据
 * @param props.stacked - 是否启用堆叠模式
 */
function AreaChartComponent({
  data,
  stacked,
}: {
  data: ChartData;
  stacked?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{data.config.title}</CardTitle>
        <CardDescription>{data.config.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={data.chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data.data}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={data.config.xAxisKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                return value.length > 20
                  ? `${value.substring(0, 17)}...`
                  : value;
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent indicator={stacked ? "dot" : "line"} />
              }
            />
            {Object.keys(data.chartConfig).map((key) => (
              <Area
                key={key}
                type="natural"
                dataKey={key}
                fill={`var(--color-${key})`}
                fillOpacity={0.4}
                stroke={`var(--color-${key})`}
                stackId={stacked ? "a" : undefined}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            {data.config.trend && (
              <div className="flex items-center gap-2 font-medium leading-none">
                本周期 {data.config.trend.direction === "up" ? "增长" : "下降"}{" "}
                {data.config.trend.percentage}%{" "}
                {data.config.trend.direction === "up" ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
            )}
            {data.config.footer && (
              <div className="leading-none text-muted-foreground">
                {data.config.footer}
              </div>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}

/**
 * 主图表渲染分发组件
 * 根据 data.chartType 渲染对应的图表组件
 * @param props.data - 包含图表类型、配置和数据的对象
 */
export function ChartRenderer({ data }: { data: ChartData }) {
  switch (data.chartType) {
    case "bar":
      return <BarChartComponent data={data} />;
    case "multiBar":
      return <MultiBarChartComponent data={data} />;
    case "line":
      return <LineChartComponent data={data} />;
    case "pie":
      return <PieChartComponent data={data} />;
    case "area":
      return <AreaChartComponent data={data} />;
    case "stackedArea":
      return <AreaChartComponent data={data} stacked />;
    default:
      return null;
  }
}

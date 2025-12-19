#!/usr/bin/env python3

"""Simple calculator tool for basic math operations.
用于基础数学运算的简单计算器工具。
"""

import math

from mcp.server import FastMCP

# 创建 FastMCP 实例
mcp = FastMCP("Calculator")


@mcp.tool(name="calculator")
def calculator(number1: float, number2: float, operator: str) -> str:
    """Performs basic calculations with two numbers.
    对两个数字执行基础计算。

    Args:
        number1: First number in the calculation
                计算中的第一个数字
        number2: Second number in the calculation
                计算中的第二个数字
        operator: Operation symbol to perform (+, -, *, /, ^, sqrt)
               Note: Only these exact symbols are supported, not words
               要执行的运算符号 (+, -, *, /, ^, sqrt)
               注意：仅支持这些精确的符号，不支持文字描述
    Returns:
        Result of the calculation
        计算结果
    """
    try:
        if operator == "+":
            result = number1 + number2
        elif operator == "-":
            result = number1 - number2
        elif operator == "*":
            result = number1 * number2
        elif operator == "/":
            if number2 == 0:
                return "Error: Division by zero"
            result = number1 / number2
        elif operator == "^":
            result = number1**number2
        elif operator == "sqrt":
            if number1 < 0:
                return "Error: Cannot take square root of negative number"
            result = math.sqrt(number1)
        else:
            return f"Error: Unsupported operator '{operator}'"

        # Format the result
        # 格式化结果
        if isinstance(result, float) and result.is_integer():
            result = int(result)

        return f"Result: {result}"
    except Exception as e:
        return f"Error: {str(e)}"


if __name__ == "__main__":
    # 运行 MCP 服务器
    mcp.run()

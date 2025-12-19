"""Tool execution utility with parallel execution support.
支持并行执行的工具执行实用程序。
"""

import asyncio
from typing import Any


async def _execute_single_tool(
    call: Any, tool_dict: dict[str, Any]
) -> dict[str, Any]:
    """Execute a single tool and handle errors.
    执行单个工具并处理错误。

    Args:
        call: Tool use block from Claude API
              来自 Claude API 的工具使用块
        tool_dict: Mapping of tool names to Tool instances
                   工具名称到 Tool 实例的映射

    Returns:
        Tool result in Claude API format
        Claude API 格式的工具结果
    """
    response = {"type": "tool_result", "tool_use_id": call.id}

    try:
        # Execute the tool directly
        # 直接执行工具
        result = await tool_dict[call.name].execute(**call.input)
        response["content"] = str(result)
    except KeyError:
        response["content"] = f"Tool '{call.name}' not found"
        response["is_error"] = True
    except Exception as e:
        response["content"] = f"Error executing tool: {str(e)}"
        response["is_error"] = True

    return response


async def execute_tools(
    tool_calls: list[Any], tool_dict: dict[str, Any], parallel: bool = True
) -> list[dict[str, Any]]:
    """Execute multiple tools sequentially or in parallel.
    以串行或并行方式执行多个工具。

    Args:
        tool_calls: List of tool use blocks
                    工具使用块列表
        tool_dict: Mapping of tool names to Tool instances
                   工具名称到 Tool 实例的映射
        parallel: Whether to execute tools in parallel
                  是否并行执行工具

    Returns:
        List of tool results
        工具结果列表
    """

    if parallel:
        return await asyncio.gather(
            *[_execute_single_tool(call, tool_dict) for call in tool_calls]
        )
    else:
        return [
            await _execute_single_tool(call, tool_dict) for call in tool_calls
        ]

"""Tools that interface with MCP servers.
与 MCP 服务器交互的工具。
"""

from typing import Any
from .base import Tool
from ..utils.connections import MCPConnection


class MCPTool(Tool):
    """Tool that wraps an MCP server tool for the agent.
    为 Agent 封装 MCP 服务器工具的类。
    """
    def __init__(
        self,
        name: str,
        description: str,
        input_schema: dict[str, Any],
        connection: "MCPConnection",
    ):
        """Initialize an MCP tool.
        初始化一个 MCP 工具。

        Args:
            name: Name of the tool
                  工具名称
            description: Tool description
                         工具描述
            input_schema: JSON Schema for tool inputs
                          工具输入的 JSON Schema
            connection: Active MCP connection
                        活跃的 MCP 连接
        """
        super().__init__(
            name=name, description=description, input_schema=input_schema
        )
        self.connection = connection

    async def execute(self, **kwargs) -> str:
        """Execute the MCP tool with the given input_schema.
        使用给定的 input_schema 执行 MCP 工具。

        Note: Currently only supports text results from MCP tools.
        注意：目前仅支持来自 MCP 工具的文本结果。
        """
        try:
            result = await self.connection.call_tool(
                self.name, arguments=kwargs
            )

            if hasattr(result, "content") and result.content:
                for item in result.content:
                    if getattr(item, "type", None) == "text":
                        return item.text

            return "No text content in tool response"
        except Exception as e:
            return f"Error executing {self.name}: {e}"

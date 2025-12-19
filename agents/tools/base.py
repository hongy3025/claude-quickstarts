"""Base tool definitions for the agent framework.
Agent 框架的基础工具定义。
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class Tool:
    """Base class for all agent tools.
    所有 Agent 工具的基类。
    """

    name: str  # 工具名称
    description: str  # 工具描述
    input_schema: dict[str, Any]  # 输入模式（JSON Schema）

    def to_dict(self) -> dict[str, Any]:
        """Convert tool to Claude API format.
        将工具转换为 Claude API 格式。
        """
        return {
            "name": self.name,
            "description": self.description,
            "input_schema": self.input_schema,
        }

    async def execute(self, **kwargs) -> str:
        """Execute the tool with provided parameters.
        使用提供的参数执行工具。
        """
        raise NotImplementedError(
            "Tool subclasses must implement execute method"
            "工具子类必须实现 execute 方法"
        )

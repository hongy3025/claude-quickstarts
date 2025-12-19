"""Code execution server tool for the agent framework.
Agent 框架的代码执行服务器工具。
"""

from dataclasses import dataclass
from typing import Any


@dataclass
class CodeExecutionServerTool:
    """Code execution server tool that uses Anthropic's server tool format.
    使用 Anthropic 服务器工具格式的代码执行服务器工具。
    """
    
    name: str = "code_execution"  # 工具名称
    type: str = "code_execution_20250522"  # 工具类型
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to Anthropic server tool format.
        转换为 Anthropic 服务器工具格式。
        """
        return {
            "type": self.type,
            "name": self.name,
        }
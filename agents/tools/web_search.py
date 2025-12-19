"""Web search server tool for the agent framework.
Agent 框架的网络搜索服务器工具。
"""

from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class WebSearchServerTool:
    """Web search server tool that uses Anthropic's server tool format.
    使用 Anthropic 服务器工具格式的网络搜索服务器工具。
    """
    
    name: str = "web_search"  # 工具名称
    type: str = "web_search_20250305"  # 工具类型
    max_uses: Optional[int] = None  # 最大使用次数
    allowed_domains: Optional[list[str]] = None  # 允许的域名列表
    blocked_domains: Optional[list[str]] = None  # 禁止的域名列表
    user_location: Optional[dict[str, Any]] = None  # 用户位置信息
    
    def to_dict(self) -> dict[str, Any]:
        """Convert to Anthropic server tool format.
        转换为 Anthropic 服务器工具格式。
        """
        tool_dict: dict[str, Any] = {
            "type": self.type,
            "name": self.name,
        }
        
        # Add optional parameters if provided
        # 如果提供了可选参数，则添加它们
        if self.max_uses is not None:
            tool_dict["max_uses"] = self.max_uses
            
        if self.allowed_domains is not None:
            tool_dict["allowed_domains"] = self.allowed_domains
            
        if self.blocked_domains is not None:
            tool_dict["blocked_domains"] = self.blocked_domains
            
        if self.user_location is not None:
            tool_dict["user_location"] = self.user_location
            
        return tool_dict
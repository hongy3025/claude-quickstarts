"""Agent implementation with Claude API and tools.
使用 Claude API 和工具实现的 Agent。
"""

import asyncio
import os
from contextlib import AsyncExitStack
from dataclasses import dataclass
from typing import Any

from anthropic import Anthropic

from .tools.base import Tool
from .utils.connections import setup_mcp_connections
from .utils.history_util import MessageHistory
from .utils.tool_util import execute_tools


@dataclass
class ModelConfig:
    """Configuration settings for Claude model parameters.
    Claude 模型参数的配置设置。
    """

    # Available models include:
    # 可用的模型包括：
    # - claude-sonnet-4-20250514 (default)
    # - claude-opus-4-20250514
    # - claude-haiku-4-5-20251001
    # - claude-3-5-sonnet-20240620
    # - claude-3-haiku-20240307
    model: str = "claude-sonnet-4-20250514"
    max_tokens: int = 4096
    temperature: float = 1.0
    context_window_tokens: int = 180000


class Agent:
    """Claude-powered agent with tool use capabilities.
    具备工具使用能力的 Claude 驱动型 Agent。
    """

    def __init__(
        self,
        name: str,
        system: str,
        tools: list[Tool] | None = None,
        mcp_servers: list[dict[str, Any]] | None = None,
        config: ModelConfig | None = None,
        verbose: bool = False,
        client: Anthropic | None = None,
        message_params: dict[str, Any] | None = None,
    ):
        """Initialize an Agent.
        初始化一个 Agent。

        Args:
            name: Agent identifier for logging
                  用于日志记录的 Agent 标识符
            system: System prompt for the agent
                    Agent 的系统提示词
            tools: List of tools available to the agent
                   Agent 可用的工具列表
            mcp_servers: MCP server configurations
                         MCP 服务器配置
            config: Model configuration with defaults
                    包含默认值的模型配置
            verbose: Enable detailed logging
                     启用详细日志记录
            client: Anthropic client instance
                    Anthropic 客户端实例
            message_params: Additional parameters for client.messages.create().
                           These override any conflicting parameters from config.
                           用于 client.messages.create() 的附加参数。
                           这些参数将覆盖 config 中任何冲突的参数。
        """
        self.name = name
        self.system = system
        self.verbose = verbose
        self.tools = list(tools or [])
        self.config = config or ModelConfig()
        self.mcp_servers = mcp_servers or []
        self.message_params = message_params or {}
        self.client = client or Anthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY", "")
        )
        self.history = MessageHistory(
            model=self.config.model,
            system=self.system,
            context_window_tokens=self.config.context_window_tokens,
            client=self.client,
        )

        if self.verbose:
            print(f"\n[{self.name}] Agent initialized")

    def _prepare_message_params(self) -> dict[str, Any]:
        """Prepare parameters for client.messages.create() call.
        准备 client.messages.create() 调用的参数。

        Returns a dict with base parameters from config, with any
        message_params overriding conflicting keys.
        返回一个包含来自配置的基础参数的字典，任何 message_params 都会覆盖冲突的键。
        """
        return {
            "model": self.config.model,
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
            "system": self.system,
            "messages": self.history.format_for_api(),
            "tools": [tool.to_dict() for tool in self.tools],
            **self.message_params,
        }

    async def _agent_loop(self, user_input: str) -> list[dict[str, Any]]:
        """Process user input and handle tool calls in a loop
        在循环中处理用户输入并处理工具调用
        """
        if self.verbose:
            print(f"\n[{self.name}] Received: {user_input}")
        await self.history.add_message("user", user_input, None)

        tool_dict = {tool.name: tool for tool in self.tools}

        while True:
            self.history.truncate()
            params = self._prepare_message_params()

            # Merge headers properly - default beta header can be overridden by message_params
            # 正确合并请求头 - 默认的 beta 请求头可以被 message_params 覆盖
            default_headers = {"anthropic-beta": "code-execution-2025-05-22"}
            if "extra_headers" in params:
                # Pop extra_headers from params and merge with defaults
                # 从 params 中弹出 extra_headers 并与默认值合并
                custom_headers = params.pop("extra_headers")
                merged_headers = {**default_headers, **custom_headers}
            else:
                merged_headers = default_headers

            response = self.client.messages.create(
                **params, extra_headers=merged_headers
            )
            tool_calls = [
                block for block in response.content if block.type == "tool_use"
            ]

            if self.verbose:
                for block in response.content:
                    if block.type == "text":
                        print(f"\n[{self.name}] Output: {block.text}")
                    elif block.type == "tool_use":
                        params_str = ", ".join(
                            [f"{k}={v}" for k, v in block.input.items()]
                        )
                        print(f"\n[{self.name}] Tool call: {block.name}({params_str})")

            await self.history.add_message(
                "assistant", response.content, response.usage
            )

            if tool_calls:
                tool_results = await execute_tools(
                    tool_calls,
                    tool_dict,
                )
                if self.verbose:
                    for block in tool_results:
                        print(f"\n[{self.name}] Tool result: {block.get('content')}")
                await self.history.add_message("user", tool_results)
            else:
                return response

    async def run_async(self, user_input: str) -> list[dict[str, Any]]:
        """Run agent with MCP tools asynchronously.
        以异步方式运行带有 MCP 工具的 Agent。
        """
        async with AsyncExitStack() as stack:
            original_tools = list(self.tools)

            try:
                mcp_tools = await setup_mcp_connections(self.mcp_servers, stack)
                self.tools.extend(mcp_tools)
                return await self._agent_loop(user_input)
            finally:
                self.tools = original_tools

    def run(self, user_input: str) -> list[dict[str, Any]]:
        """Run agent synchronously
        同步运行 Agent
        """
        return asyncio.run(self.run_async(user_input))

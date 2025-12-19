"""Connection handling for MCP servers.
MCP 服务器的连接处理。
"""

from abc import ABC, abstractmethod
from contextlib import AsyncExitStack
from typing import Any

from mcp import ClientSession, StdioServerParameters
from mcp.client.sse import sse_client
from mcp.client.stdio import stdio_client

from ..tools.mcp_tool import MCPTool


class MCPConnection(ABC):
    """Base class for MCP server connections.
    MCP 服务器连接的基类。
    """

    def __init__(self):
        """Initialize connection state.
        初始化连接状态。
        """
        self.session = None  # 会话实例
        self._rw_ctx = None  # 读写上下文
        self._session_ctx = None  # 会话上下文

    @abstractmethod
    async def _create_rw_context(self):
        """Create the read/write context based on connection type.
        根据连接类型创建读写上下文。
        """

    async def __aenter__(self):
        """Initialize MCP server connection.
        初始化 MCP 服务器连接。
        """
        self._rw_ctx = await self._create_rw_context()
        read_write = await self._rw_ctx.__aenter__()
        read, write = read_write
        self._session_ctx = ClientSession(read, write)
        self.session = await self._session_ctx.__aenter__()
        await self.session.initialize()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up MCP server connection resources.
        清理 MCP 服务器连接资源。
        """
        try:
            if self._session_ctx:
                await self._session_ctx.__aexit__(exc_type, exc_val, exc_tb)
            if self._rw_ctx:
                await self._rw_ctx.__aexit__(exc_type, exc_val, exc_tb)
        except Exception as e:
            print(f"Error during cleanup: {e}")
        finally:
            self.session = None
            self._session_ctx = None
            self._rw_ctx = None

    async def list_tools(self) -> Any:
        """Retrieve available tools from the MCP server.
        从 MCP 服务器检索可用工具。
        """
        response = await self.session.list_tools()
        return response.tools

    async def call_tool(
        self, tool_name: str, arguments: dict[str, Any]
    ) -> Any:
        """Call a tool on the MCP server with provided arguments.
        使用提供的参数在 MCP 服务器上调用工具。
        """
        return await self.session.call_tool(tool_name, arguments=arguments)


class MCPConnectionStdio(MCPConnection):
    """MCP connection using standard input/output.
    使用标准输入/输出的 MCP 连接。
    """

    def __init__(
        self, command: str, args: list[str] = [], env: dict[str, str] = None
    ):
        """Initialize Stdio connection.
        初始化 Stdio 连接。

        Args:
            command: Command to run
                     要运行的命令
            args: Command arguments
                  命令参数
            env: Environment variables
                 环境变量
        """
        super().__init__()
        self.command = command
        self.args = args
        self.env = env

    async def _create_rw_context(self):
        """Create Stdio read/write context.
        创建 Stdio 读写上下文。
        """
        return stdio_client(
            StdioServerParameters(
                command=self.command, args=self.args, env=self.env
            )
        )


class MCPConnectionSSE(MCPConnection):
    """MCP connection using Server-Sent Events.
    使用服务器发送事件 (SSE) 的 MCP 连接。
    """

    def __init__(self, url: str, headers: dict[str, str] = None):
        """Initialize SSE connection.
        初始化 SSE 连接。

        Args:
            url: SSE server URL
                 SSE 服务器 URL
            headers: HTTP headers
                     HTTP 请求头
        """
        super().__init__()
        self.url = url
        self.headers = headers or {}

    async def _create_rw_context(self):
        """Create SSE read/write context.
        创建 SSE 读写上下文。
        """
        return sse_client(url=self.url, headers=self.headers)


def create_mcp_connection(config: dict[str, Any]) -> MCPConnection:
    """Factory function to create the appropriate MCP connection.
    用于创建适当 MCP 连接的工厂函数。
    """
    conn_type = config.get("type", "stdio").lower()

    if conn_type == "stdio":
        if not config.get("command"):
            raise ValueError("Command is required for STDIO connections")
        return MCPConnectionStdio(
            command=config["command"],
            args=config.get("args"),
            env=config.get("env"),
        )

    elif conn_type == "sse":
        if not config.get("url"):
            raise ValueError("URL is required for SSE connections")
        return MCPConnectionSSE(
            url=config["url"], headers=config.get("headers")
        )

    else:
        raise ValueError(f"Unsupported connection type: {conn_type}")


async def setup_mcp_connections(
    mcp_servers: list[dict[str, Any]] | None,
    stack: AsyncExitStack,
) -> list[MCPTool]:
    """Set up MCP server connections and create tool interfaces.
    设置 MCP 服务器连接并创建工具接口。
    """
    if not mcp_servers:
        return []

    mcp_tools = []

    for config in mcp_servers:
        try:
            connection = create_mcp_connection(config)
            await stack.enter_async_context(connection)
            tool_definitions = await connection.list_tools()

            for tool_info in tool_definitions:
                mcp_tools.append(
                    MCPTool(
                        name=tool_info.name,
                        description=tool_info.description
                        or f"MCP tool: {tool_info.name}",
                        input_schema=tool_info.inputSchema,
                        connection=connection,
                    )
                )

        except Exception as e:
            print(f"Error setting up MCP server {config}: {e}")

    print(
        f"Loaded {len(mcp_tools)} MCP tools from {len(mcp_servers)} servers."
    )
    return mcp_tools

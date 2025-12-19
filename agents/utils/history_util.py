"""Message history with token tracking and prompt caching.
带有 Token 追踪和提示词缓存的消息历史管理。
"""

from typing import Any


class MessageHistory:
    """Manages chat history with token tracking and context management.
    管理聊天历史，具备 Token 追踪和上下文管理功能。
    """

    def __init__(
        self,
        model: str,
        system: str,
        context_window_tokens: int,
        client: Any,
        enable_caching: bool = True,
    ):
        """Initialize message history.
        初始化消息历史。

        Args:
            model: Model identifier
                   模型标识符
            system: System prompt
                    系统提示词
            context_window_tokens: Maximum tokens allowed in context window
                                   上下文窗口允许的最大 Token 数
            client: Anthropic client for token counting
                    用于计算 Token 的 Anthropic 客户端
            enable_caching: Enable prompt caching
                            是否启用提示词缓存
        """
        self.model = model
        self.system = system
        self.context_window_tokens = context_window_tokens
        self.messages: list[dict[str, Any]] = []
        self.total_tokens = 0
        self.enable_caching = enable_caching
        self.message_tokens: list[tuple[int, int]] = (
            []
        )  # List of (input_tokens, output_tokens) tuples
           # (输入 Token, 输出 Token) 元组列表
        self.client = client

        # set initial total tokens to system prompt
        # 将初始总 Token 数设置为系统提示词的 Token 数
        try:
            system_token = (
                self.client.messages.count_tokens(
                    model=self.model,
                    system=self.system,
                    messages=[{"role": "user", "content": "test"}],
                ).input_tokens
                - 1
            )

        except Exception:
            system_token = len(self.system) / 4

        self.total_tokens = system_token

    async def add_message(
        self,
        role: str,
        content: str | list[dict[str, Any]],
        usage: Any | None = None,
    ):
        """Add a message to the history and track token usage.
        将消息添加到历史记录并追踪 Token 使用情况。

        Args:
            role: Message role (user or assistant)
                  消息角色（user 或 assistant）
            content: Message content
                     消息内容
            usage: Token usage information from API response
                   来自 API 响应的 Token 使用信息
        """
        if isinstance(content, str):
            content = [{"type": "text", "text": content}]

        message = {"role": role, "content": content}
        self.messages.append(message)

        if role == "assistant" and usage:
            total_input = (
                usage.input_tokens
                + getattr(usage, "cache_read_input_tokens", 0)
                + getattr(usage, "cache_creation_input_tokens", 0)
            )
            output_tokens = usage.output_tokens

            current_turn_input = total_input - self.total_tokens
            self.message_tokens.append((current_turn_input, output_tokens))
            self.total_tokens += current_turn_input + output_tokens

    def truncate(self) -> None:
        """Remove oldest messages when context window limit is exceeded.
        当超过上下文窗口限制时，移除最旧的消息。
        """
        if self.total_tokens <= self.context_window_tokens:
            return

        TRUNCATION_NOTICE_TOKENS = 25
        TRUNCATION_MESSAGE = {
            "role": "user",
            "content": [
                {
                    "type": "text",
                    "text": "[Earlier history has been truncated.]",
                }
            ],
        }

        def remove_message_pair():
            """Remove the oldest user-assistant message pair.
            移除最旧的一对用户-助手消息。
            """
            self.messages.pop(0)
            self.messages.pop(0)

            if self.message_tokens:
                input_tokens, output_tokens = self.message_tokens.pop(0)
                self.total_tokens -= input_tokens + output_tokens

        while (
            self.message_tokens
            and len(self.messages) >= 2
            and self.total_tokens > self.context_window_tokens
        ):
            remove_message_pair()

            if self.messages and self.message_tokens:
                original_input_tokens, original_output_tokens = (
                    self.message_tokens[0]
                )
                self.messages[0] = TRUNCATION_MESSAGE
                self.message_tokens[0] = (
                    TRUNCATION_NOTICE_TOKENS,
                    original_output_tokens,
                )
                self.total_tokens += (
                    TRUNCATION_NOTICE_TOKENS - original_input_tokens
                )

    def format_for_api(self) -> list[dict[str, Any]]:
        """Format messages for Claude API with optional caching.
        为 Claude API 格式化消息，并支持可选的缓存。
        """
        result = [
            {"role": m["role"], "content": m["content"]} for m in self.messages
        ]

        if self.enable_caching and self.messages:
            result[-1]["content"] = [
                {**block, "cache_control": {"type": "ephemeral"}}
                for block in self.messages[-1]["content"]
            ]
        return result

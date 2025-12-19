"""
Claude SDK Client Configuration
===============================

Functions for creating and configuring the Claude Agent SDK client.
用于创建和配置 Claude Agent SDK 客户端的函数。
"""

import json
import os
from pathlib import Path

from claude_code_sdk import ClaudeCodeOptions, ClaudeSDKClient
from claude_code_sdk.types import HookMatcher

from security import bash_security_hook


# Puppeteer MCP tools for browser automation
# 用于浏览器自动化的 Puppeteer MCP 工具
PUPPETEER_TOOLS = [
    "mcp__puppeteer__puppeteer_navigate",
    "mcp__puppeteer__puppeteer_screenshot",
    "mcp__puppeteer__puppeteer_click",
    "mcp__puppeteer__puppeteer_fill",
    "mcp__puppeteer__puppeteer_select",
    "mcp__puppeteer__puppeteer_hover",
    "mcp__puppeteer__puppeteer_evaluate",
]

# Built-in tools
# 内置工具
BUILTIN_TOOLS = [
    "Read",
    "Write",
    "Edit",
    "Glob",
    "Grep",
    "Bash",
]


def create_client(project_dir: Path, model: str) -> ClaudeSDKClient:
    """
    Create a Claude Agent SDK client with multi-layered security.
    创建具有多层安全保护的 Claude Agent SDK 客户端。

    Args:
        project_dir: Directory for the project
                     项目目录
        model: Claude model to use
               要使用的 Claude 模型

    Returns:
        Configured ClaudeSDKClient
        配置好的 ClaudeSDKClient

    Security layers (defense in depth):
    安全层（深度防御）：
    1. Sandbox - OS-level bash command isolation prevents filesystem escape
       沙箱 - 操作系统级的 Bash 命令隔离，防止文件系统逃逸
    2. Permissions - File operations restricted to project_dir only
       权限 - 文件操作仅限于 project_dir
    3. Security hooks - Bash commands validated against an allowlist
       安全钩子 - 根据允许列表验证 Bash 命令
       (see security.py for ALLOWED_COMMANDS)
       （请参阅 security.py 中的 ALLOWED_COMMANDS）
    """
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise ValueError(
            "ANTHROPIC_API_KEY environment variable not set.\n"
            "Get your API key from: https://console.anthropic.com/"
        )

    # Create comprehensive security settings
    # Note: Using relative paths ("./**") restricts access to project directory
    # since cwd is set to project_dir
    # 创建全面的安全设置
    # 注意：使用相对路径 ("./**") 会限制对项目目录的访问，因为 cwd 已设置为 project_dir
    security_settings = {
        "sandbox": {"enabled": True, "autoAllowBashIfSandboxed": True},
        "permissions": {
            "defaultMode": "acceptEdits",  # Auto-approve edits within allowed directories
                                           # 自动批准允许目录内的编辑
            "allow": [
                # Allow all file operations within the project directory
                # 允许在项目目录内进行所有文件操作
                "Read(./**)",
                "Write(./**)",
                "Edit(./**)",
                "Glob(./**)",
                "Grep(./**)",
                # Bash permission granted here, but actual commands are validated
                # by the bash_security_hook (see security.py for allowed commands)
                # 此处授予了 Bash 权限，但实际命令由 bash_security_hook 验证
                # （请参阅 security.py 获取允许的命令）
                "Bash(*)",
                # Allow Puppeteer MCP tools for browser automation
                # 允许用于浏览器自动化的 Puppeteer MCP 工具
                *PUPPETEER_TOOLS,
            ],
        },
    }

    # Ensure project directory exists before creating settings file
    # 在创建设置文件之前确保项目目录存在
    project_dir.mkdir(parents=True, exist_ok=True)

    # Write settings to a file in the project directory
    # 将设置写入项目目录中的文件
    settings_file = project_dir / ".claude_settings.json"
    with open(settings_file, "w") as f:
        json.dump(security_settings, f, indent=2)

    print(f"Created security settings at {settings_file}")
    print("   - Sandbox enabled (OS-level bash isolation)")
    print(f"   - Filesystem restricted to: {project_dir.resolve()}")
    print("   - Bash commands restricted to allowlist (see security.py)")
    print("   - MCP servers: puppeteer (browser automation)")
    print()

    return ClaudeSDKClient(
        options=ClaudeCodeOptions(
            model=model,
            system_prompt="You are an expert full-stack developer building a production-quality web application.",
            allowed_tools=[
                *BUILTIN_TOOLS,
                *PUPPETEER_TOOLS,
            ],
            mcp_servers={
                "puppeteer": {"command": "npx", "args": ["puppeteer-mcp-server"]}
            },
            hooks={
                "PreToolUse": [
                    HookMatcher(matcher="Bash", hooks=[bash_security_hook]),
                ],
            },
            max_turns=1000,
            cwd=str(project_dir.resolve()),
            settings=str(settings_file.resolve()),  # Use absolute path
                                                    # 使用绝对路径
        )
    )

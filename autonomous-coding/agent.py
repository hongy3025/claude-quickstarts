"""
Agent Session Logic
===================

Core agent interaction functions for running autonomous coding sessions.
核心 Agent 交互函数，用于运行自主编码会话。
"""

import asyncio
from pathlib import Path
from typing import Optional

from claude_code_sdk import ClaudeSDKClient

from client import create_client
from progress import print_session_header, print_progress_summary
from prompts import get_initializer_prompt, get_coding_prompt, copy_spec_to_project


# Configuration
# 配置
AUTO_CONTINUE_DELAY_SECONDS = 3
"""Delay between automatic session continuations.
自动会话持续之间的延迟秒数。
"""


async def run_agent_session(
    client: ClaudeSDKClient,
    message: str,
    project_dir: Path,
) -> tuple[str, str]:
    """
    Run a single agent session using Claude Agent SDK.
    使用 Claude Agent SDK 运行单个 Agent 会话。

    Args:
        client: Claude SDK client
                Claude SDK 客户端
        message: The prompt to send
                 要发送的提示词
        project_dir: Project directory path
                     项目目录路径

    Returns:
        (status, response_text) where status is:
        (状态, 响应文本)，其中状态为：
        - "continue" if agent should continue working
                     如果 Agent 应该继续工作
        - "error" if an error occurred
                  如果发生错误
    """
    print("Sending prompt to Claude Agent SDK...\n")

    try:
        # Send the query
        # 发送查询
        await client.query(message)

        # Collect response text and show tool use
        # 收集响应文本并显示工具使用情况
        response_text = ""
        async for msg in client.receive_response():
            msg_type = type(msg).__name__

            # Handle AssistantMessage (text and tool use)
            # 处理 AssistantMessage（文本和工具使用）
            if msg_type == "AssistantMessage" and hasattr(msg, "content"):
                for block in msg.content:
                    block_type = type(block).__name__

                    if block_type == "TextBlock" and hasattr(block, "text"):
                        response_text += block.text
                        print(block.text, end="", flush=True)
                    elif block_type == "ToolUseBlock" and hasattr(block, "name"):
                        print(f"\n[Tool: {block.name}]", flush=True)
                        if hasattr(block, "input"):
                            input_str = str(block.input)
                            if len(input_str) > 200:
                                print(f"   Input: {input_str[:200]}...", flush=True)
                            else:
                                print(f"   Input: {input_str}", flush=True)

            # Handle UserMessage (tool results)
            # 处理 UserMessage（工具结果）
            elif msg_type == "UserMessage" and hasattr(msg, "content"):
                for block in msg.content:
                    block_type = type(block).__name__

                    if block_type == "ToolResultBlock":
                        result_content = getattr(block, "content", "")
                        is_error = getattr(block, "is_error", False)

                        # Check if command was blocked by security hook
                        # 检查命令是否被安全钩子拦截
                        if "blocked" in str(result_content).lower():
                            print(f"   [BLOCKED] {result_content}", flush=True)
                        elif is_error:
                            # Show errors (truncated)
                            # 显示错误（截断）
                            error_str = str(result_content)[:500]
                            print(f"   [Error] {error_str}", flush=True)
                        else:
                            # Tool succeeded - just show brief confirmation
                            # 工具成功 - 仅显示简短确认
                            print("   [Done]", flush=True)

        print("\n" + "-" * 70 + "\n")
        return "continue", response_text

    except Exception as e:
        print(f"Error during agent session: {e}")
        return "error", str(e)


async def run_autonomous_agent(
    project_dir: Path,
    model: str,
    max_iterations: Optional[int] = None,
) -> None:
    """
    Run the autonomous agent loop.
    运行自主 Agent 循环。

    Args:
        project_dir: Directory for the project
                     项目目录
        model: Claude model to use
               要使用的 Claude 模型
        max_iterations: Maximum number of iterations (None for unlimited)
                        最大迭代次数（None 表示不限制）
    """
    print("\n" + "=" * 70)
    print("  AUTONOMOUS CODING AGENT DEMO")
    print("=" * 70)
    print(f"\nProject directory: {project_dir}")
    print(f"Model: {model}")
    if max_iterations:
        print(f"Max iterations: {max_iterations}")
    else:
        print("Max iterations: Unlimited (will run until completion)")
    print()

    # Create project directory
    # 创建项目目录
    project_dir.mkdir(parents=True, exist_ok=True)

    # Check if this is a fresh start or continuation
    # 检查是全新开始还是继续
    tests_file = project_dir / "feature_list.json"
    is_first_run = not tests_file.exists()

    if is_first_run:
        print("Fresh start - will use initializer agent")
        print()
        print("=" * 70)
        print("  NOTE: First session takes 10-20+ minutes!")
        print("  The agent is generating 200 detailed test cases.")
        print("  This may appear to hang - it's working. Watch for [Tool: ...] output.")
        print("=" * 70)
        print()
        # Copy the app spec into the project directory for the agent to read
        # 将应用规范复制到项目目录中供 Agent 读取
        copy_spec_to_project(project_dir)
    else:
        print("Continuing existing project")
        print_progress_summary(project_dir)

    # Main loop
    # 主循环
    iteration = 0

    while True:
        iteration += 1

        # Check max iterations
        # 检查最大迭代次数
        if max_iterations and iteration > max_iterations:
            print(f"\nReached max iterations ({max_iterations})")
            print("To continue, run the script again without --max-iterations")
            break

        # Print session header
        # 打印会话头
        print_session_header(iteration, is_first_run)

        # Create client (fresh context)
        # 创建客户端（全新上下文）
        client = create_client(project_dir, model)

        # Choose prompt based on session type
        # 根据会话类型选择提示词
        if is_first_run:
            prompt = get_initializer_prompt()
            is_first_run = False  # Only use initializer once
                                  # 仅使用一次初始化器
        else:
            prompt = get_coding_prompt()

        # Run session with async context manager
        # 使用异步上下文管理器运行会话
        async with client:
            status, response = await run_agent_session(client, prompt, project_dir)

        # Handle status
        # 处理状态
        if status == "continue":
            print(f"\nAgent will auto-continue in {AUTO_CONTINUE_DELAY_SECONDS}s...")
            print_progress_summary(project_dir)
            await asyncio.sleep(AUTO_CONTINUE_DELAY_SECONDS)

        elif status == "error":
            print("\nSession encountered an error")
            print("Will retry with a fresh session...")
            await asyncio.sleep(AUTO_CONTINUE_DELAY_SECONDS)

        # Small delay between sessions
        # 会话之间的小延迟
        if max_iterations is None or iteration < max_iterations:
            print("\nPreparing next session...\n")
            await asyncio.sleep(1)

    # Final summary
    # 最终总结
    print("\n" + "=" * 70)
    print("  SESSION COMPLETE")
    print("=" * 70)
    print(f"\nProject directory: {project_dir}")
    print_progress_summary(project_dir)

    # Print instructions for running the generated application
    # 打印运行生成应用程序的指令
    print("\n" + "-" * 70)
    print("  TO RUN THE GENERATED APPLICATION:")
    print("-" * 70)
    print(f"\n  cd {project_dir.resolve()}")
    print("  ./init.sh           # Run the setup script")
    print("  # Or manually:")
    print("  npm install && npm run dev")
    print("\n  Then open http://localhost:3000 (or check init.sh for the URL)")
    print("-" * 70)

    print("\nDone!")

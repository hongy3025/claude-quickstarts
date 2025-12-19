"""
Security Hooks for Autonomous Coding Agent
==========================================

Pre-tool-use hooks that validate bash commands for security.
Uses an allowlist approach - only explicitly permitted commands can run.
自主编码 Agent 的安全钩子。
工具使用前的钩子，用于验证 Bash 命令的安全性。
采用允许列表方法 - 仅允许运行明确许可的命令。
"""

import os
import shlex


# Allowed commands for development tasks
# Minimal set needed for the autonomous coding demo
# 开发任务允许的命令
# 自主编码演示所需的最少命令集
ALLOWED_COMMANDS = {
    # File inspection
    # 文件检查
    "ls",
    "cat",
    "head",
    "tail",
    "wc",
    "grep",
    # File operations (agent uses SDK tools for most file ops, but cp/mkdir needed occasionally)
    # 文件操作（Agent 对大多数文件操作使用 SDK 工具，但偶尔需要 cp/mkdir）
    "cp",
    "mkdir",
    "chmod",  # For making scripts executable; validated separately
              # 用于使脚本可执行；单独验证
    # Directory
    # 目录
    "pwd",
    # Node.js development
    # Node.js 开发
    "npm",
    "node",
    # Version control
    # 版本控制
    "git",
    # Process management
    # 进程管理
    "ps",
    "lsof",
    "sleep",
    "pkill",  # For killing dev servers; validated separately
              # 用于终止开发服务器；单独验证
    # Script execution
    # 脚本执行
    "init.sh",  # Init scripts; validated separately
                # 初始化脚本；单独验证
}

# Commands that need additional validation even when in the allowlist
# 即使在允许列表中，也需要额外验证的命令
COMMANDS_NEEDING_EXTRA_VALIDATION = {"pkill", "chmod", "init.sh"}


def split_command_segments(command_string: str) -> list[str]:
    """
    Split a compound command into individual command segments.
    将复合命令拆分为单独的命令段。

    Handles command chaining (&&, ||, ;) but not pipes (those are single commands).
    处理命令链（&&, ||, ;），但不处理管道（管道被视为单个命令）。

    Args:
        command_string: The full shell command
                        完整的 shell 命令

    Returns:
        List of individual command segments
        单个命令段列表
    """
    import re

    # Split on && and || while preserving the ability to handle each segment
    # This regex splits on && or || that aren't inside quotes
    # 在 && 和 || 处拆分，同时保留处理每个段的能力
    # 此正则表达式在不在引号内的 && 或 || 处拆分
    segments = re.split(r"\s*(?:&&|\|\|)\s*", command_string)

    # Further split on semicolons
    # 进一步在分号处拆分
    result = []
    for segment in segments:
        sub_segments = re.split(r'(?<!["\'])\s*;\s*(?!["\'])', segment)
        for sub in sub_segments:
            sub = sub.strip()
            if sub:
                result.append(sub)

    return result


def extract_commands(command_string: str) -> list[str]:
    """
    Extract command names from a shell command string.
    从 shell 命令字符串中提取命令名称。

    Handles pipes, command chaining (&&, ||, ;), and subshells.
    Returns the base command names (without paths).
    处理管道、命令链（&&, ||, ;）和子 shell。
    返回基本命令名称（不含路径）。

    Args:
        command_string: The full shell command
                        完整的 shell 命令

    Returns:
        List of command names found in the string
        在字符串中找到的命令名称列表
    """
    commands = []

    # shlex doesn't treat ; as a separator, so we need to pre-process
    # shlex 不将 ; 视为分隔符，因此我们需要预处理
    import re

    # Split on semicolons that aren't inside quotes (simple heuristic)
    # This handles common cases like "echo hello; ls"
    # 在不在引号内的分号处拆分（简单启发式）
    # 这处理了像 "echo hello; ls" 这样的常见情况
    segments = re.split(r'(?<!["\'])\s*;\s*(?!["\'])', command_string)

    for segment in segments:
        segment = segment.strip()
        if not segment:
            continue

        try:
            tokens = shlex.split(segment)
        except ValueError:
            # Malformed command (unclosed quotes, etc.)
            # Return empty to trigger block (fail-safe)
            # 格式错误的命令（未闭合的引号等）
            # 返回空以触发拦截（故障安全）
            return []

        if not tokens:
            continue

        # Track when we expect a command vs arguments
        # 跟踪我们何时预期命令与参数
        expect_command = True

        for token in tokens:
            # Shell operators indicate a new command follows
            # Shell 运算符表示后面跟着一个新命令
            if token in ("|", "||", "&&", "&"):
                expect_command = True
                continue

            # Skip shell keywords that precede commands
            # 跳过命令之前的 shell 关键字
            if token in (
                "if",
                "then",
                "else",
                "elif",
                "fi",
                "for",
                "while",
                "until",
                "do",
                "done",
                "case",
                "esac",
                "in",
                "!",
                "{",
                "}",
            ):
                continue

            # Skip flags/options
            # 跳过标志/选项
            if token.startswith("-"):
                continue

            # Skip variable assignments (VAR=value)
            # 跳过变量赋值 (VAR=value)
            if "=" in token and not token.startswith("="):
                continue

            if expect_command:
                # Extract the base command name (handle paths like /usr/bin/python)
                # 提取基本命令名称（处理类似 /usr/bin/python 的路径）
                cmd = os.path.basename(token)
                commands.append(cmd)
                expect_command = False

    return commands


def validate_pkill_command(command_string: str) -> tuple[bool, str]:
    """
    Validate pkill commands - only allow killing dev-related processes.
    验证 pkill 命令 - 仅允许终止与开发相关的进程。

    Uses shlex to parse the command, avoiding regex bypass vulnerabilities.
    使用 shlex 解析命令，避免正则表达式绕过漏洞。

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
        (是否允许, 被拦截的原因) 元组
    """
    # Allowed process names for pkill
    # pkill 允许的进程名称
    allowed_process_names = {
        "node",
        "npm",
        "npx",
        "vite",
        "next",
    }

    try:
        tokens = shlex.split(command_string)
    except ValueError:
        return False, "Could not parse pkill command"

    if not tokens:
        return False, "Empty pkill command"

    # Separate flags from arguments
    # 将标志与参数分开
    args = []
    for token in tokens[1:]:
        if not token.startswith("-"):
            args.append(token)

    if not args:
        return False, "pkill requires a process name"

    # The target is typically the last non-flag argument
    # 目标通常是最后一个非标志参数
    target = args[-1]

    # For -f flag (full command line match), extract the first word as process name
    # e.g., "pkill -f 'node server.js'" -> target is "node server.js", process is "node"
    # 对于 -f 标志（全命令行匹配），提取第一个词作为进程名称
    # 例如，"pkill -f 'node server.js'" -> target 是 "node server.js"，进程是 "node"
    if " " in target:
        target = target.split()[0]

    if target in allowed_process_names:
        return True, ""
    return False, f"pkill only allowed for dev processes: {allowed_process_names}"


def validate_chmod_command(command_string: str) -> tuple[bool, str]:
    """
    Validate chmod commands - only allow making files executable with +x.
    验证 chmod 命令 - 仅允许使用 +x 使文件可执行。

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
        (是否允许, 被拦截的原因) 元组
    """
    try:
        tokens = shlex.split(command_string)
    except ValueError:
        return False, "Could not parse chmod command"

    if not tokens or tokens[0] != "chmod":
        return False, "Not a chmod command"

    # Look for the mode argument
    # Valid modes: +x, u+x, a+x, etc. (anything ending with +x for execute permission)
    # 查找 mode 参数
    # 有效模式：+x, u+x, a+x 等（任何以 +x 结尾的执行权限模式）
    mode = None
    files = []

    for token in tokens[1:]:
        if token.startswith("-"):
            # Skip flags like -R (we don't allow recursive chmod anyway)
            # 跳过类似 -R 的标志（反正我们也不允许递归 chmod）
            return False, "chmod flags are not allowed"
        elif mode is None:
            mode = token
        else:
            files.append(token)

    if mode is None:
        return False, "chmod requires a mode"

    if not files:
        return False, "chmod requires at least one file"

    # Only allow +x variants (making files executable)
    # This matches: +x, u+x, g+x, o+x, a+x, ug+x, etc.
    # 仅允许 +x 变体（使文件可执行）
    # 匹配：+x, u+x, g+x, o+x, a+x, ug+x 等。
    import re

    if not re.match(r"^[ugoa]*\+x$", mode):
        return False, f"chmod only allowed with +x mode, got: {mode}"

    return True, ""


def validate_init_script(command_string: str) -> tuple[bool, str]:
    """
    Validate init.sh script execution - only allow ./init.sh.
    验证 init.sh 脚本执行 - 仅允许 ./init.sh。

    Returns:
        Tuple of (is_allowed, reason_if_blocked)
        (是否允许, 被拦截的原因) 元组
    """
    try:
        tokens = shlex.split(command_string)
    except ValueError:
        return False, "Could not parse init script command"

    if not tokens:
        return False, "Empty command"

    # The command should be exactly ./init.sh (possibly with arguments)
    # 命令应该是完全的 ./init.sh（可能带有参数）
    script = tokens[0]

    # Allow ./init.sh or paths ending in /init.sh
    # 允许 ./init.sh 或以 /init.sh 结尾的路径
    if script == "./init.sh" or script.endswith("/init.sh"):
        return True, ""

    return False, f"Only ./init.sh is allowed, got: {script}"


def get_command_for_validation(cmd: str, segments: list[str]) -> str:
    """
    Find the specific command segment that contains the given command.
    查找包含给定命令的特定命令段。

    Args:
        cmd: The command name to find
             要查找的命令名称
        segments: List of command segments
                  命令段列表

    Returns:
        The segment containing the command, or empty string if not found
        包含该命令的段，如果未找到则为空字符串
    """
    for segment in segments:
        segment_commands = extract_commands(segment)
        if cmd in segment_commands:
            return segment
    return ""


async def bash_security_hook(input_data, tool_use_id=None, context=None):
    """
    Pre-tool-use hook that validates bash commands using an allowlist.
    工具使用前的钩子，使用允许列表验证 Bash 命令。

    Only commands in ALLOWED_COMMANDS are permitted.
    仅允许 ALLOWED_COMMANDS 中的命令。

    Args:
        input_data: Dict containing tool_name and tool_input
                    包含 tool_name 和 tool_input 的字典
        tool_use_id: Optional tool use ID
                     可选的工具使用 ID
        context: Optional context
                 可选的上下文

    Returns:
        Empty dict to allow, or {"decision": "block", "reason": "..."} to block
        返回空字典以允许，或返回 {"decision": "block", "reason": "..."} 以拦截
    """
    if input_data.get("tool_name") != "Bash":
        return {}

    command = input_data.get("tool_input", {}).get("command", "")
    if not command:
        return {}

    # Extract all commands from the command string
    # 从命令字符串中提取所有命令
    commands = extract_commands(command)

    if not commands:
        # Could not parse - fail safe by blocking
        # 无法解析 - 通过拦截进行故障安全处理
        return {
            "decision": "block",
            "reason": f"Could not parse command for security validation: {command}",
        }

    # Split into segments for per-command validation
    # 拆分为段以进行逐个命令的验证
    segments = split_command_segments(command)

    # Check each command against the allowlist
    # 根据允许列表检查每个命令
    for cmd in commands:
        if cmd not in ALLOWED_COMMANDS:
            return {
                "decision": "block",
                "reason": f"Command '{cmd}' is not in the allowed commands list",
            }

        # Additional validation for sensitive commands
        # 对敏感命令进行额外验证
        if cmd in COMMANDS_NEEDING_EXTRA_VALIDATION:
            # Find the specific segment containing this command
            # 查找包含此命令的特定段
            cmd_segment = get_command_for_validation(cmd, segments)
            if not cmd_segment:
                cmd_segment = command  # Fallback to full command
                                      # 回退到完整命令

            if cmd == "pkill":
                allowed, reason = validate_pkill_command(cmd_segment)
                if not allowed:
                    return {"decision": "block", "reason": reason}
            elif cmd == "chmod":
                allowed, reason = validate_chmod_command(cmd_segment)
                if not allowed:
                    return {"decision": "block", "reason": reason}
            elif cmd == "init.sh":
                allowed, reason = validate_init_script(cmd_segment)
                if not allowed:
                    return {"decision": "block", "reason": reason}

    return {}

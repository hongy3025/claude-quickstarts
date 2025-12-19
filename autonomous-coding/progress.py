"""
Progress Tracking Utilities
===========================

Functions for tracking and displaying progress of the autonomous coding agent.
用于跟踪和显示自主编码 Agent 进度的函数。
"""

import json
from pathlib import Path


def count_passing_tests(project_dir: Path) -> tuple[int, int]:
    """
    Count passing and total tests in feature_list.json.
    统计 feature_list.json 中通过的测试和总测试数。

    Args:
        project_dir: Directory containing feature_list.json
                     包含 feature_list.json 的目录

    Returns:
        (passing_count, total_count)
        (通过数, 总数)
    """
    tests_file = project_dir / "feature_list.json"

    if not tests_file.exists():
        return 0, 0

    try:
        with open(tests_file, "r") as f:
            tests = json.load(f)

        total = len(tests)
        passing = sum(1 for test in tests if test.get("passes", False))

        return passing, total
    except (json.JSONDecodeError, IOError):
        return 0, 0


def print_session_header(session_num: int, is_initializer: bool) -> None:
    """Print a formatted header for the session.
    打印格式化后的会话头部。

    Args:
        session_num: Current session number
                     当前会话编号
        is_initializer: Whether this is an initializer session
                        是否为初始化会话
    """
    session_type = "INITIALIZER" if is_initializer else "CODING AGENT"

    print("\n" + "=" * 70)
    print(f"  SESSION {session_num}: {session_type}")
    print("=" * 70)
    print()


def print_progress_summary(project_dir: Path) -> None:
    """Print a summary of current progress.
    打印当前进度摘要。

    Args:
        project_dir: Project directory path
                     项目目录路径
    """
    passing, total = count_passing_tests(project_dir)

    if total > 0:
        percentage = (passing / total) * 100
        print(f"\nProgress: {passing}/{total} tests passing ({percentage:.1f}%)")
    else:
        print("\nProgress: feature_list.json not yet created")

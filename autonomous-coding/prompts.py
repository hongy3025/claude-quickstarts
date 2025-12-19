"""
Prompt Loading Utilities
========================

Functions for loading prompt templates from the prompts directory.
用于从 prompts 目录加载提示词模板的函数。
"""

import shutil
from pathlib import Path


PROMPTS_DIR = Path(__file__).parent / "prompts"
"""Directory containing prompt templates.
包含提示词模板的目录。
"""


def load_prompt(name: str) -> str:
    """Load a prompt template from the prompts directory.
    从 prompts 目录加载提示词模板。

    Args:
        name: Name of the prompt file (without extension)
              提示词文件的名称（不含扩展名）

    Returns:
        The content of the prompt file
        提示词文件的内容
    """
    prompt_path = PROMPTS_DIR / f"{name}.md"
    return prompt_path.read_text()


def get_initializer_prompt() -> str:
    """Load the initializer prompt.
    加载初始化器提示词。

    Returns:
        The content of the initializer prompt
        初始化器提示词的内容
    """
    return load_prompt("initializer_prompt")


def get_coding_prompt() -> str:
    """Load the coding agent prompt.
    加载编码 Agent 提示词。

    Returns:
        The content of the coding prompt
        编码提示词的内容
    """
    return load_prompt("coding_prompt")


def copy_spec_to_project(project_dir: Path) -> None:
    """Copy the app spec file into the project directory for the agent to read.
    将应用规范文件复制到项目目录中，供 Agent 读取。

    Args:
        project_dir: Destination project directory
                     目标项目目录
    """
    spec_source = PROMPTS_DIR / "app_spec.txt"
    spec_dest = project_dir / "app_spec.txt"
    if not spec_dest.exists():
        shutil.copy(spec_source, spec_dest)
        print("Copied app_spec.txt to project directory")

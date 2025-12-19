"""File operation tools for reading and writing files.
用于读写文件的文件操作工具。
"""

import asyncio
import glob
import os
from pathlib import Path

from .base import Tool


class FileReadTool(Tool):
    """Tool for reading files and listing directories.
    用于读取文件和列出目录内容的工具。
    """

    def __init__(self):
        super().__init__(
            name="file_read",
            description="""
            Read files or list directory contents.
            读取文件或列出目录内容。

            Operations:
            操作：
            - read: Read the contents of a file
                   读取文件内容
            - list: List files in a directory
                   列出目录中的文件
            """,
            input_schema={
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["read", "list"],
                        "description": "File operation to perform",
                    },
                    "path": {
                        "type": "string",
                        "description": "File path for read or directory path",
                    },
                    "max_lines": {
                        "type": "integer",
                        "description": "Maximum lines to read (0 means no limit)",
                    },
                    "pattern": {
                        "type": "string",
                        "description": "File pattern to match",
                    },
                },
                "required": ["operation", "path"],
            },
        )

    async def execute(
        self,
        operation: str,
        path: str,
        max_lines: int = 0,
        pattern: str = "*",
    ) -> str:
        """Execute a file read operation.
        执行文件读取操作。

        Args:
            operation: The operation to perform (read or list)
                       要执行的操作（read 或 list）
            path: The file or directory path
                  文件或目录路径
            max_lines: Maximum lines to read (for read operation, 0 means no limit)
                       最大读取行数（用于读取操作，0 表示无限制）
            pattern: File pattern to match (for list operation)
                     要匹配的文件模式（用于列出操作）

        Returns:
            Result of the operation as string
            作为字符串的操作结果
        """
        if operation == "read":
            return await self._read_file(path, max_lines)
        elif operation == "list":
            return await self._list_files(path, pattern)
        else:
            return f"Error: Unsupported operation '{operation}'"

    async def _read_file(self, path: str, max_lines: int = 0) -> str:
        """Read a file from disk.
        从磁盘读取文件。
        
        Args:
            path: Path to the file to read
                  要读取的文件路径
            max_lines: Maximum number of lines to read (0 means read entire file)
                       最大读取行数（0 表示读取整个文件）
        """
        try:
            file_path = Path(path)

            if not file_path.exists():
                return f"Error: File not found at {path}"
            if not file_path.is_file():
                return f"Error: {path} is not a file"

            def read_sync():
                with open(file_path, encoding="utf-8", errors="replace") as f:
                    if max_lines > 0:
                        lines = []
                        for i, line in enumerate(f):
                            if i >= max_lines:
                                break
                            lines.append(line)
                        return "".join(lines)
                    return f.read()

            return await asyncio.to_thread(read_sync)
        except Exception as e:
            return f"Error reading {path}: {str(e)}"

    async def _list_files(self, directory: str, pattern: str = "*") -> str:
        """List files in a directory.
        列出目录中的文件。
        """
        try:
            dir_path = Path(directory)

            if not dir_path.exists():
                return f"Error: Directory not found at {directory}"
            if not dir_path.is_dir():
                return f"Error: {directory} is not a directory"

            def list_sync():
                search_pattern = f"{directory}/{pattern}"
                files = glob.glob(search_pattern)

                if not files:
                    return f"No files found matching {directory}/{pattern}"

                file_list = []
                for file_path in sorted(files):
                    path_obj = Path(file_path)
                    rel_path = str(file_path).replace(str(dir_path) + "/", "")

                    if path_obj.is_dir():
                        file_list.append(f"📁 {rel_path}/")
                    else:
                        file_list.append(f"📄 {rel_path}")

                return "\n".join(file_list)

            return await asyncio.to_thread(list_sync)
        except Exception as e:
            return f"Error listing files in {directory}: {str(e)}"


class FileWriteTool(Tool):
    """Tool for writing and editing files.
    用于写入和编辑文件的工具。
    """

    def __init__(self):
        super().__init__(
            name="file_write",
            description="""
            Write or edit files.
            写入或编辑文件。

            Operations:
            操作：
            - write: Create or completely replace a file
                   创建或完全替换文件
            - edit: Make targeted changes to parts of a file
                   对文件的部分内容进行针对性修改
            """,
            input_schema={
                "type": "object",
                "properties": {
                    "operation": {
                        "type": "string",
                        "enum": ["write", "edit"],
                        "description": "File operation to perform",
                    },
                    "path": {
                        "type": "string",
                        "description": "File path to write to or edit",
                    },
                    "content": {
                        "type": "string",
                        "description": "Content to write",
                    },
                    "old_text": {
                        "type": "string",
                        "description": "Text to replace (for edit operation)",
                    },
                    "new_text": {
                        "type": "string",
                        "description": "Replacement text (for edit operation)",
                    },
                },
                "required": ["operation", "path"],
            },
        )

    async def execute(
        self,
        operation: str,
        path: str,
        content: str = "",
        old_text: str = "",
        new_text: str = "",
    ) -> str:
        """Execute a file write operation.
        执行文件写入操作。

        Args:
            operation: The operation to perform (write or edit)
                       要执行的操作（write 或 edit）
            path: The file path
                  文件路径
            content: Content to write (for write operation)
                     要写入的内容（用于写入操作）
            old_text: Text to replace (for edit operation)
                      要替换的文本（用于编辑操作）
            new_text: Replacement text (for edit operation)
                      替换文本（用于编辑操作）

        Returns:
            Result of the operation as string
            作为字符串的操作结果
        """
        if operation == "write":
            if not content:
                return "Error: content parameter is required"
            return await self._write_file(path, content)
        elif operation == "edit":
            if not old_text or not new_text:
                return (
                    "Error: both old_text and new_text parameters "
                    "are required for edit operation"
                )
            return await self._edit_file(path, old_text, new_text)
        else:
            return f"Error: Unsupported operation '{operation}'"

    async def _write_file(self, path: str, content: str) -> str:
        """Write content to a file.
        将内容写入文件。
        """
        try:
            file_path = Path(path)
            os.makedirs(file_path.parent, exist_ok=True)

            def write_sync():
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(content)
                return (
                    f"Successfully wrote {len(content)} "
                    f"characters to {path}"
                )

            return await asyncio.to_thread(write_sync)
        except Exception as e:
            return f"Error writing to {path}: {str(e)}"

    async def _edit_file(self, path: str, old_text: str, new_text: str) -> str:
        """Make targeted changes to a file.
        对文件进行针对性修改。
        """
        try:
            file_path = Path(path)

            if not file_path.exists():
                return f"Error: File not found at {path}"
            if not file_path.is_file():
                return f"Error: {path} is not a file"

            def edit_sync():
                try:
                    with open(
                        file_path, encoding="utf-8", errors="replace"
                    ) as f:
                        content = f.read()

                    if old_text not in content:
                        return (
                            f"Error: The specified text was not "
                            f"found in {path}"
                        )

                    # Count occurrences to warn about multiple matches
                    # 计算出现次数以对多次匹配发出警告
                    count = content.count(old_text)
                    if count > 1:
                        # Edit with warning about multiple occurrences
                        # 编辑并对多次出现发出警告
                        new_content = content.replace(old_text, new_text)
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        return (
                            f"Warning: Found {count} occurrences. "
                            f"All were replaced in {path}"
                        )
                    else:
                        # One occurrence, straightforward replacement
                        # 出现一次，直接替换
                        new_content = content.replace(old_text, new_text)
                        with open(file_path, "w", encoding="utf-8") as f:
                            f.write(new_content)
                        return f"Successfully edited {path}"
                except UnicodeDecodeError:
                    return f"Error: {path} appears to be a binary file"

            return await asyncio.to_thread(edit_sync)
        except Exception as e:
            return f"Error editing {path}: {str(e)}"

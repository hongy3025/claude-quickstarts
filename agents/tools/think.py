"""Think tool for internal reasoning.
用于内部推理的思考工具。
"""

from .base import Tool


class ThinkTool(Tool):
    """Tool for internal reasoning without executing external actions.
    用于内部推理而无需执行外部操作的工具。
    """

    def __init__(self):
        super().__init__(
            name="think",
            description=(
                "Use the tool to think about something. It will not obtain "
                "new information or change the database, but just append the "
                "thought to the log. Use it when complex reasoning or some "
                "cache memory is needed."
                "使用此工具思考某些事情。它不会获取新信息或更改数据库，只是将想法附加到日志中。"
                "在需要复杂推理或某些缓存记忆时使用它。"
            ),
            input_schema={
                "type": "object",
                "properties": {
                    "thought": {
                        "type": "string",
                        "description": "A thought to think about.",
                    }
                },
                "required": ["thought"],
            },
        )

    async def execute(self, thought: str) -> str:
        """Simply returns the thought back to the model.
        只需将想法返回给模型。
        """
        return "Thinking complete!"

from langchain_core.tools import BaseTool
from agents.planning_agent import PlanningAgent
from agents.task_agent import TaskAgent
from pydantic import BaseModel, Field
from typing import Optional, Type
from talkshop_searchutils.generation.parser import JsonParser
from agents.memory import Memory, GlobalServerMemory

class MemorySaveToolInput(BaseModel):
    key: str = Field(description="The string representing the name of the variable for which the saved data should be associated with")
    value: str = Field(description="The value to be saved in the memory")

class MemorySaveTool(BaseTool):
    name: str = "agent_memory"
    description: str = "Use this tool for saving information needed to carry out tasks throughout the planning and execution process. It will act as a global dictionary."
    args_schema: Type[BaseModel] = MemorySaveToolInput

    memory: Optional[Memory] = Field(exclude=True)

    def __init__(self, memory: Memory):
        super().__init__(memory=memory)

    def _run(
        self, key: str, value: str, run_manager=None, **kwargs
    ) -> str:
        if self.memory is not None:
             self.memory.add_item(key, value)
             return "Memory Stored - key: {0} value {1}".format(key, value)
        else:
             memory_address = run_manager.metadata.get('memory_webhook')
             memory = GlobalServerMemory(memory_address)
             result = memory.add_item(key, value)
             if result is not None:
                return "Memory Stored - key: {0} value {1}".format(key, value)
        return ""
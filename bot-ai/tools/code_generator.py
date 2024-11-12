from langchain_core.tools import BaseTool
from agents.planning_agent import PlanningAgent
from agents.task_agent import TaskAgent
from pydantic import BaseModel, Field
from typing import Optional, Type
from talkshop_searchutils.generation.parser import JsonParser
import json
import os
import requests

class CodeGeneratorInput(BaseModel):
    task: str = Field(description="The string representing the task that needs code generating from")
    tools: str = Field(description="A comma separated list of infrastructure tools for which to complete the task. For cloud operations the appropriate cloud cli (command line) tool should be used and terraform should be used for any cloud related resource creation. If no cloud service is explicitly mentioned assume that AWS is being used.")

class CodeGeneratorAgentTool(BaseTool):
    name: str = "code_generator"
    description: str = "This is a tool for generating infrastructure code for given simple executable tasks. The tool acts as an infrastructure / dev ops engineer."
    args_schema: Type[BaseModel] = CodeGeneratorInput
    planner: Optional[PlanningAgent] = Field(exclude=True)
    local_mode: bool = Field(exclude=True, default=False)

    def __init__(self, special_api_spec: dict, local_mode: bool = False):
        if local_mode:
            super().__init__(local_mode=local_mode,
                             planner=PlanningAgent("../pipelines/planning_agent.json", special_api_spec, True))
        else:
            super().__init__(local_mode=False, planner=None)

    def _run(
        self, task: str, tools: str, run_manager=None, **kwargs
    ) -> str:
        if self.local_mode:
            code = self.planner.execute_plan_step(task, tools)
            return json.dumps(code)
        else:
            metadata = run_manager.metadata
            run_id = run_manager.run_id
            thread_id = metadata.get('thread_id')
            task_inputs = {
                'task': task,
                'tools': tools
            }
            postData = json.dumps({
                'threadId': thread_id,
                'runId': run_id,
                'conversationId': metadata.get('conversationId'),
                'agent': 'codegen',
                'tool_call_id': metadata.get('tool_call_id'),
                'message': json.dumps(task_inputs),
                'senderId': metadata.get('senderId')
            })
            try:
                result = requests.post(
                    metadata.get('agent_webhook'),
                    headers={'Content-Type': 'application/json'},
                    data=postData
                )
                if result.status_code == 200:
                    return "Generating code for the task"
                else:
                    return "Could not generate code for the task due to error calling code generator."
            except Exception as e:
                print(e)
                return "Could not generate code for task due to error calling service."

    async def _arun(
        self, query: str, run_manager=None
    ) -> str:
        """Use the tool asynchronously."""
        raise NotImplementedError("this does not support async")
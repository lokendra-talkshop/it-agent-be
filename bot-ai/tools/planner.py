from langchain_core.tools import BaseTool
from agents.planning_agent import PlanningAgent
from agents.task_agent import TaskAgent
from pydantic import BaseModel, Field
from typing import Optional, Type
from talkshop_searchutils.generation.parser import JsonParser
import json
import os
import requests

class PlannerInput(BaseModel):
    task: str = Field(description="The task for which a plan needs to be created. Each step of the generated plan is also a task.")
    tools: str = Field(description="A comma separated list of infrastructure tools for which to complete the task. For cloud operations the appropriate cloud cli (command line) tool should be used and if any cloud resources may need to be created terraform should be in this list. If no cloud service is explicitly mentioned assume that AWS is being used.")
    action: str = Field(description="A string representing what action the planner should do. This should be set to 'continue' when wanting to continue breaking down or continuing to generate plan steps, otherwise it should be blank")
    is_user_task: bool = Field(description="A boolean to determine if the task is coming from user input or the result of the planning tool")

class PlannerAgentTool(BaseTool):
    name: str = "planner"
    description: str = "This is a tool for determining the steps of a plan in order to carry out complex tasks that need multiple actions in order to complete a task."
    args_schema: Type[BaseModel] = PlannerInput

    planning_agent: Optional[PlanningAgent] = Field(exclude=True)
    task_agent: Optional[TaskAgent] = Field(exclude=True)
    local_mode: bool = Field(exclude=True)

    def __init__(self, special_api_spec, local_mode: bool):
        planning_agent = None
        task_agent = None
        if local_mode:
            task_agent = TaskAgent("../pipelines/task_agent.json", use_llm_cache=True)
            planning_agent = PlanningAgent("../pipelines/planning_agent.json", specialApiSpec=special_api_spec, generate_code=False)
        super().__init__(local_mode=local_mode, task_agent=task_agent, planning_agent=planning_agent)

    def _run(
        self, task: str, tools: str, action: str, is_user_task: bool, run_manager=None, **kwargs
    ) -> str:
        if self.local_mode:
            if is_user_task:
                task = self.task_agent.create_task(partialData={'task': task})
                task_json = {
                    'task': task.get('description').get('description'),
                    'description': {
                        'description': task.get('description').get('description'),
                        'tools': task.get('description').get('tools')
                    }
                }
            else:
                task_json = {
                    'task': task,
                    'description': {
                        'description': task,
                        'tools': tools.split(",")
                    }
                }

            from agents.planning_agent import PlanningNode
            plan_tree = PlanningNode(task={
                'description': task_json.get('description').get('description'),
                'tools': ",".join(task_json.get('description').get('tools')),
                'type': 'root'
            })
            full_plan = self.planning_agent.generate_full_plan(task_json, save_tree=plan_tree)
            while True:
                try:
                    plan = next(full_plan)
                except StopIteration:
                    break
                except Exception as e:
                    print(f"Error generating plan: {e}")
                    break
            final_plan_result = plan_tree.to_json()
            return json.dumps(final_plan_result)
        else:
            metadata = run_manager.metadata
            run_id = run_manager.run_id
            thread_id = metadata.get('thread_id')
            task_inputs = {
                'task': task,
                'tools': tools,
                'action': action,
                'is_user_task': is_user_task
            }
            print("Task Meta Data")
            print(metadata)

            postData = json.dumps({
                'threadId': thread_id,
                'runId': run_id,
                'conversationId': metadata.get('conversationId'),
                'agent': 'planner',
                'tool_call_id': metadata.get('tool_call_id'),
                'message': json.dumps(task_inputs),
                'senderId': metadata.get('senderId')
            })
            print("Tool post data")
            print(postData)
            if is_user_task:
                webhook = metadata.get('agent_webhook')
            else:
                webhook = metadata.get('planner_webhook')

            print(f"Using webhook {webhook}")
            try:
                result = requests.post(
                    webhook,
                    headers={'Content-Type': 'application/json'},
                    data=postData
                )
                if result.status_code == 200:
                    return "Generating plan for the task"
                else:
                    return "Could not generate a plan for the task due to error calling code generator."
            except requests.RequestException as e:
                print(f"Request error: {e}")
                return "Could not generate code for task due to error calling service."

    async def _arun(
        self, query: str, run_manager=None
    ) -> str:
        """Use the tool asynchronously."""
        raise NotImplementedError("this does not support async")
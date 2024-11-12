from agents.planning_agent import PlanningAgent
from talkshop_searchutils.generation.parser import JsonParser
import json
class CodeGenerationAgent:
    def __init__(self, special_api_spec):
         self.planning_agent = PlanningAgent("pipelines/planning_agent.json", specialApiSpec= special_api_spec, generate_code= True)
    
    def run(self, task, tools):
         code = self.planning_agent.execute_plan_step(task, tools)
         jsonCode = JsonParser(code).json
         return json.dumps(jsonCode)
    
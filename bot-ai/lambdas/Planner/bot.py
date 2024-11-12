from agents.task_agent import TaskAgent
from agents.planning_agent import PlanningAgent
from talkshop_searchutils.generation.parser import JsonParser




class IACAgentBot:
    def __init__(self, task_config_file, planning_config_file, api_file, max_depth = 2, generate_code = True):
        self.task_agent = TaskAgent(task_config_file, use_llm_cache=True)
        self.generate_code = generate_code
        self.planning_agent = PlanningAgent(planning_config_file, api_file, True, max_depth)

    def run_plan_system_2(self, inputs):
            if inputs.get('type') == 'executable':
                  if self.generate_code:
                     print(inputs.get('description'))
                     tools = ",".join(inputs.get('tools'))
                     
                     code = self.planning_agent.execute_plan_step(inputs.get('description'), tools )
                     return  JsonParser(code).json , 'code', 'system2' , inputs.get('depth')
            else:                            
                current_plan_so_far = inputs.get('current_plan')
                current_context_so_far = inputs.get('current_context')
                next_possible_steps = self.planning_agent.generate_plan(inputs, 'system2', inputs.get('depth') + 1 , current_plan_so_far, current_context_so_far)
                return next_possible_steps, "plan" , 'system2' , inputs.get('depth') + 1

    def run_plan_system_1(self, inputs):
            if 'type' in inputs:
                if inputs.get('type') == 'executable':
                  if self.generate_code:
                     print(inputs.get('description'))
                     tools = ",".join(inputs.get('tools'))
                     
                     code = self.planning_agent.execute_plan_step(inputs.get('description'), tools )
                     return JsonParser(code).json , 'code', 'system1', inputs.get('depth')                   
                else:
                    subtask = {
                        'task' : inputs.get('description'),
                        'description' : {
                            'description' : inputs.get('description'),
                            'tools' : inputs.get('tools')
                        }
                        }   
                 
                    new_depth = inputs.get('depth' ) + 1
                    sub_plan = self.planning_agent.generate_plan(subtask, 'system1', current_depth = new_depth)
                    return sub_plan , 'plan' , 'system1' , new_depth
            else:
               plan = self.planning_agent.generate_plan( inputs , 'system1',  0)
               return plan , 'plan', 'system1' , inputs.get('depth')

    def run_task(self, task , inputs , plan_type = 'system1'):
        print(task)
        print(plan_type)
        if task == 'task':
            output = self.task_agent.create_task(allowlist = ",".join(inputs.get('allowlist',[])) , partialData = inputs)
            return output , 'task' , plan_type, 0
        elif task == 'plan':
            if plan_type == 'system1':
                return self.run_plan_system_1(inputs)
            else:
                return self.run_plan_system_2(inputs) 
     

        




    

    

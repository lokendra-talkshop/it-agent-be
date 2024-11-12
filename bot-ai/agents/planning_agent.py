import json
from talkshop_searchutils.generation.pipelines.loader import PipelineLoader
from llm import LanguageModelFactory
from talkshop_searchutils.generation.parser import JsonParser



class PlanningNode:
    def __init__(self, task ):
       self.task = task
       self.children = []
    
    def add_children(self, child):
        self.children.append(PlanningNode(child))

    def to_json(self):
        if(len(self.children) > 0) :
           plan =  {
               'task' : self.task,
               'steps' : [
                   x.to_json() for x in self.children
               ]
           }
           return plan 
        else:
            plan = {'task' : self.task }

class PlanningAgent:
    def __init__(self, config, specialApiSpec, generate_code = True , max_plan_depth = 4):
        loader = PipelineLoader(config, llm_factory = LanguageModelFactory())
        self.llms = loader.get_llms()
        self.max_plan_depth = max_plan_depth
        self.generate_code = generate_code
        with open(specialApiSpec) as f:
            apiJson = f.read()
        self.apiJsonInput = apiJson.replace("{","{{").replace("}","}}") #todo move this to the searchutils for openai conversion of json input 
 
    def generate_plan(self,task, type = 'system1', current_depth = 0 , current_plan = [] , current_state = {'environment' : None, 'extra' : None}):
        tools = ",".join(task.get('description').get('tools'))
        print("Generating plan")
        print(current_depth)
        if(type == 'system1'):
            plan_output = self.llms[0].generate({
                                                'maxplandepth' : self.max_plan_depth, 
                                                'depth' : current_depth,
                                                'task' : task.get('name'), 
                                                'description' : task.get('description').get('description'), 
                                                'tools' : tools
                                                }
                                                )
            outputs = JsonParser(plan_output.get('text')).json
            for i in range(len(outputs['plan'])):
                outputs['plan'][i]['tools'] = task.get('description').get('tools')
            return outputs


        else:
            
            plan_string = ",".join(["Step {0}: {1}".format(idx, x) for idx, x in enumerate(current_plan)])
            current_state = json.dumps(current_state).replace("{","{{").replace("}", "}}")
            plan_output = self.llms[2].generate({
                                                'maxplandepth' : self.max_plan_depth, 
                                                'systemstate' : current_state,
                                                'current' : plan_string,
                                                'task' : task.get('name'), 
                                                'description' : task.get('description').get('description'), 
                                                'tools' : tools,
                                                'depth' : current_depth
                 
            })
            
            return JsonParser(plan_output.get('text')).json

    def execute_plan_step(self, task_step, tools):
        execution_output = self.llms[1].generate({'apiSpec' : self.apiJsonInput ,
                                                  'task' : task_step , 
                                                  'tools' : tools , 
                                                  'symbol_table' : '[]' 
                                                  } )
        return execution_output.get('text')
    
    def generate_full_plan(self, task, save_tree = None,  depth = 0 , type = 'system1' , output_save_tree = False):
        plan = self.generate_plan(task, current_depth= depth, type = type).get('plan')
        yield plan
        full_plan = []
        for pidx, plan_step in enumerate(plan):
             if save_tree is not None:
                 save_tree.add_children(plan_step)
             
             if plan_step.get('type') == 'executable':
                 if self.generate_code:
                     print("Generating Code for step {0}".format(pidx))
                     print(plan_step.get('description'))
                     code = self.execute_plan_step(plan_step.get('description'), ",".join(task.get('description').get('tools')))
                     plan_step['code'] = JsonParser(code).json
                     
                 full_plan.append(plan_step)
             else:
                 subtask = {
                   'task' : plan_step.get('description'),
                   'description' : {
                     'description' : plan_step.get('description'),
                     'tools' : task.get('description').get('tools')
                   }
                 } 
                 if save_tree is not None:
                     save_tree.children[pidx].task = subtask
                 
                 print("Breaking down Task:", subtask.get('task'))
                #  print(subtask.get('task'))
                 save_tree_child = None
                 if save_tree:
                    save_tree_child = save_tree.children[pidx]                     
                 sub_plan = self.generate_full_plan(subtask, save_tree = save_tree_child , depth = depth + 1 , type = type)
                 while(True):
                     try: 
                         sub_item = next(sub_plan)
                         yield sub_item 
                     except StopIteration:
                         break                        
                 full_plan.extend(sub_plan)
        return full_plan
     
if __name__=="__main__":
    import langchain
    from langchain_community.cache import SQLiteCache
    import redis 
    langchain.llm_cache = SQLiteCache("db.sqllite")
    from task_agent import TaskAgent

    task = {'name': "Design and implement a multi-tier architecture for the company's web application using cloud services", 'description': {'description': "Design and implement a multi-tier architecture for the company's web application utilizing cloud services for scalability and reliability.", 'tools': ['Amazon Web Services (AWS)', 'Docker', 'Kubernetes', 'Open Tofu', 'PostgreSQL', 'Redis']}}
    plan_agent = PlanningAgent("../pipelines/planning_agent.json","./special_api.json")
    a = '''{"description":"Ask the manager for the requirements regarding the S3 bucket configuration, including the bucket name, region, and specific policies or permissions needed.","type":"executable","tools":["Terraform","AWS CLI"]}'''
    a = eval(a)
    result = plan_agent.execute_plan_step(a.get('description'), a.get('tools'))
  
    print(result)

from talkshop_searchutils.generation.assistant.assistant import OpenAiAssistant
from talkshop_searchutils.generation.assistant.instruction import Instruction
from talkshop_searchutils.generation.assistant.tool import Tool
import openai

import importlib

from tools.code_generator import CodeGeneratorAgentTool
from tools.code_execution import CodeExecutionAgentTool
from tools.planner import PlannerAgentTool
from tools.memory_tool import MemorySaveTool

def setup_code_execution_params(x, y):
    x.update(y)
    return x

class ChatAgent:

    def __init__(self, config, special_api_spec , local_mode = False):
         self.service = config.get('service','openai')
         if config.get('service', 'openai') == 'openai':
              instruction = Instruction(config.get('title') + " " + config.get('persona',"") ,  config.get('description'))
              input_prompt = "Question/Task:\n{question}"
              from langchain_community.tools.ddg_search import DuckDuckGoSearchRun
              tools = [
                    Tool(CodeGeneratorAgentTool(special_api_spec), lambda x , y : x, True and local_mode == False),
                    Tool(CodeExecutionAgentTool(local_mode), setup_code_execution_params, True and local_mode == False),
                    Tool(PlannerAgentTool(special_api_spec, local_mode), lambda x, y : x, True and local_mode == False),
                    Tool(MemorySaveTool(None), lambda x,y : x)
              ]
              examples = config.get('examples', [])
              example_template = config.get('example_template', "")
              self.bot = OpenAiAssistant(config.get('name'), config.get('model'),instruction, input_prompt , tools = tools , 
                                         example_template = example_template, examples = examples , return_tool_outputs = True)
    
    def stream(self, input, thread_id, bot_id, attachments = []):
       if self.service in ['openai']:
          return self.bot.stream({'question' : input } , thread_id = thread_id , stream = True)
          
    def run(self, input, thread_id,  extra_context = {}, tool_outputs = None ):
        content = []
        content.append({'_type' : 'text' , 
                        'apply_template' : True,
                        'data' : {
                             "question" : input
                      }})
        return self.bot.run(content, thread_id = thread_id, extra_context = extra_context , tool_outputs = tool_outputs)


if __name__ == "__main__":
    config = None
    import json
    import langchain
    from langchain_community.cache import SQLiteCache
    langchain.llm_cache = SQLiteCache(".llm.db")
    with open("infrabot.json") as f:
        config = json.loads(f.read())
    import uuid
    convoId = str(uuid.uuid4())
    agent = ChatAgent(config, "special_api.json" , local_mode= True)
    #output = agent.run("How do I install kubectl.", N1one, extra_context = {'conversation_id' : convoId})
    #print(output)


    result = agent.run("set up a s3 bucket for a public website.", None, extra_context = {'conversation_id' : convoId})


    #result = agent.run("Yes", result.thread_id, extra_context = {'conversation_id' : convoId})
    #result = agent.run("Yes", result.thread_id, extra_context = {'conversation_id' : convoId})
    #result = agent.run("Yes" ,result.thread_id, extra_context = {'conversation_id' : convoId})
    #result = agent.run("Bucket name should be test-bucket and it should be in us-east-2", result.thread_id, {'conversation_id' : convoId})
    print(result)

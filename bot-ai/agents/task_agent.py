from talkshop_searchutils.generation.pipelines.loader import PipelineLoader
from talkshop_searchutils.generation.parser import JsonParser
from llm import LanguageModelFactory
class TaskAgent():
    def __init__(self, config_file, use_llm_cache = False) -> None:
        loader = PipelineLoader(config_file, llm_factory = LanguageModelFactory(), use_llm_cache = use_llm_cache)
        self.llms = loader.get_llms()

    def create_task(self, level = 'low', allowlist = '' , partialData = {} , do_generate_verification_code = True):
        if allowlist == '':
           allowlist = '[empty list]'
        if(partialData.get("task") is None):
            result  = self.llms[0].generate({'level' : level , 'allowlist' : allowlist})
            parser = JsonParser(result.get('text'))
            task = parser.json
        else:
            task = {'task' : partialData.get('task')}

        description = self.llms[1].generate({'name' : task.get('task')})
        description_obj = JsonParser(description.get('text')).json
        tools_list = ",".join(description_obj.get('tools'))
        verification_code_json = None
        if do_generate_verification_code:
           verification_code = self.llms[2].generate({'task' : task.get('task'), 'description' : description_obj.get('description') , 'tools' : tools_list })
           verification_code_json = JsonParser(verification_code.get('text')).json
        return {
            'name' : task.get('task'),
            'description' : description_obj,
            'topic_words' : task.get('topic words',[]),
            'verification_code' : verification_code_json 
        }
        
    
if __name__ == "__main__":
    agent = TaskAgent("../pipelines/task_agent.json")
    task = agent.create_task(level = 'low')
    print(task)


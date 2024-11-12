from talkshop_searchutils.generation.assistant.assistant import OpenAiAssistant
from talkshop_searchutils.generation.assistant.instruction import Instruction
import openai

from processor import ProcessorPipeline
import importlib


def setup_file_processors(config):
      processors = config.get('file_processors',{})
      processor_map = {}
      for fileType in processors.keys():      
         pipeline = ProcessorPipeline()
         for processor in processors[fileType]:
            try:
                  module = importlib.import_module("processors." + processor.get('module'))
            except Exception:
                  raise Exception("Could not load module Not existant processor " + processor.get('module'))
            params = processor.get('parameters', {})
            pipeline.add_processor(module, params)
         processor_map[fileType] = pipeline
      return processor_map
 



class Bot:

    def __init__(self, config):
         self.service = config.get('service','openai')
         self.file_processors = setup_file_processors(config)
         if config.get('service', 'openai') == 'openai':
              instruction = Instruction(config.get('title') + " " + config.get('persona') ,  config.get('description'))
              input_prompt = "Question/Task:\n{question}"
              from langchain_community.tools.ddg_search import DuckDuckGoSearchRun
                  
              tools = [
                    (DuckDuckGoSearchRun(), lambda x: x.get('query'))
              ]
              examples = config.get('examples', [])
              example_template = config.get('example_template', "")
              self.bot = OpenAiAssistant(config.get('name'), config.get('model'),instruction, input_prompt , tools = tools , 
                                         example_template = example_template, examples = examples )
    
    def stream(self, input, thread_id, bot_id, attachments = []):
       if self.service in ['openai']:
          return self.bot.stream({'question' : input } , thread_id = thread_id , stream = True)
          
    def run(self, input, thread_id, bot_id, attachments = []):
        content = []
        content.append({'_type' : 'text' , 
                        'apply_template' : True,
                        'data' : {
                             "question" : input
                      }})
        convert_to_image = lambda x : {'image_id' : x.id  } if isinstance(x, openai.types.FileObject) else {'image_url' : x}
        convert_to_text = lambda x, y: {'text' : y } if x == 'text' else convert_to_image(y)
        for attachment in attachments:
            file_type = attachment.split(".")[-1]
            file_processing_pipeline = self.file_processors.get(file_type);
            if file_processing_pipeline is None:
               file_processing_pipeline = self.file_processors.get('*')
               if file_processing_pipeline is None:
                   continue
            processed_attachements = file_processing_pipeline.run(attachment, service = self.service)
            for key in processed_attachements.keys():
                 result = processed_attachements[key]
                 if(isinstance(result.get('data'), list)):
                    content.extend([{
                        '_type' : result.get('type'),
                        'data' : convert_to_text(result.get('type'), x),
                        'apply_template' : False
                    } for x in result.get('data')])
                 else:
                  content.append({
                        '_type' : result.get('type'),
                        'data' : convert_to_text(result.get('type'), result.get('data')),
                        'apply_template' : False
                  })
        return self.bot.run(content, thread_id = thread_id)

class PipelineObject:
    def __init__(self, location):
        self.fileLocation = location 
        self.outputs = []

class Processor():
    def __init__(self, module, extra_params):
          self.module = module 
          self.extra_params = extra_params
        
    def run(self, pipelineObject , **kwargs):
        final_kwargs = {}
        final_kwargs.update(self.extra_params)
        final_kwargs.update(kwargs)
        output = self.module.process(pipelineObject, **final_kwargs)
        pipelineObject.outputs = output 


class ProcessorPipeline():
    def __init__(self):
          self.processors = []
     
    def add_processor(self, module, extra_params):
         self.processors.append(Processor(module, extra_params))

    def run(self, fileLocation , **kwargs):
         object = PipelineObject(fileLocation)
         
         for processor in self.processors:
            run_kwargs = {}
            run_kwargs.update(kwargs)
            processor.run(object , **run_kwargs)
         return object.outputs

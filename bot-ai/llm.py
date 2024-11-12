from talkshop_searchutils.generation.llm import OpenAILanguageChain

class LanguageModelFactory:
  def __init__(self):
     pass;
  def get(self):
     return OpenAILanguageChain(use_cache = True)
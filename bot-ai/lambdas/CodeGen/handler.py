import json
import requests
import uuid
import os

import langchain
from talkshop_searchutils.generation.cache import DynamoDBCache
from agents.code_generation_agent import CodeGenerationAgent


def handle(event, context):
    langchain.llm_cache = DynamoDBCache('LanguageModelCache', region_name = 'us-east-2' , 
                                        aws_access_key = os.environ.get('AWS_ACCESS_KEY') , 
                                        aws_secret_key = os.environ.get('AWS_SECRET_KEY'))
    special_api_location = os.environ.get('SPECIAL_API', 'special_api.json')
    codegenAgent = CodeGenerationAgent(special_api_location)
    message = json.loads(event.get("message"))
    code = codegenAgent.run(message.get('task'), message.get('tools'))

    print("Event")
    print(event)

    print("Code")
    print(code)

    result_dict = {
         "message" : code,
         "senderId" : event.get('senderId'),
         "conversationId" : event.get('conversationId'),
         'runId' : event.get('runId'),
         "threadId" : event.get('threadId'),
         'tool_call_id' : event.get('tool_call_id')
    }
    print(event.get('webhook'))
    result =  requests.post(event.get('webhook'), headers = {'Content-Type' : 'application/json'}, data= json.dumps(result_dict))  
    if result.status_code == 200:
        print('Success')
    else:
        print("Failure")
    return result_dict
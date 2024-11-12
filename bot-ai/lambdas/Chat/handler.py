import json
import requests
import uuid
import os

import langchain
from talkshop_searchutils.generation.cache import DynamoDBCache
from agents.chat_agent import ChatAgent
from talkshop_searchutils.generation.assistant.assistant import ChatResult


def handle(event, context):
    print("Event received")
    print(event)
    langchain.llm_cache = DynamoDBCache('LanguageModelCache', region_name = 'us-east-2' , 
                                        aws_access_key = os.environ.get('AWS_ACCESS_KEY') , 
                                        aws_secret_key = os.environ.get('AWS_SECRET_KEY'))
    special_api_location = os.environ.get('SPECIAL_API', 'special_api.json')

    with open('infrabot.json', 'r') as file:
        config = json.load(file)

    chatAgent = ChatAgent(config, special_api_location)
    tool_outputs = None
    if 'tool_call_id' in event:
        tool_outputs = [{
            'output' : event.get('tool_outputs'),
            'tool_call_id' : event.get('tool_call_id')         
        }]

        print(tool_outputs)

    chatResult = chatAgent.run(
        event.get('textInput'), 
        event.get('threadId'), 
        {
         'runId' : event.get('runId'),
         'conversationId' : event.get('conversationId'),
         'senderId' : event.get('senderId'),
         'agent_webhook' : event.get('agent_webhook'),
         'planner_webhook' : event.get('planner_webhook'),
         'memory_webhook' : event.get('memory_webhook'),
        },  
        tool_outputs= tool_outputs 
    )

    print("Chat Result")
    print(f"ChatResult(response={chatResult.response}, thread_id={chatResult.thread_id}, is_async={chatResult.is_async})")

    if not chatResult.is_async:
        message = chatResult.response
        threadId = chatResult.thread_id
        result_json = {
         'senderId' : event.get('senderId'),
         'message' : message,
         'conversationId' : event.get('conversationId')
        }

        if threadId is not None:
            result_json['thread_id'] = threadId

        print(result_json)
        result = requests.post(event.get('webhook'), headers = {'Content-Type' : 'application/json'}, data= json.dumps(result_json))
            
        if result.status_code == 200:
            print("Success")
        else:
            print(result.status_code)
            print(result.text)
        return result_json


    
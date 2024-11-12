from bot import IACAgentBot
import json
import requests
import uuid
import os

import langchain
from talkshop_searchutils.generation.cache import DynamoDBCache

def handle(event, context):
    langchain.llm_cache = DynamoDBCache('LanguageModelCache', region_name = 'us-east-2' , 
                                        aws_access_key = os.environ.get('AWS_ACCESS_KEY') , 
                                        aws_secret_key = os.environ.get('AWS_SECRET_KEY'))
    special_api_location = os.environ.get('SPECIAL_API', 'special_api.json')
    pipeline_location = os.environ.get('ROOT_DIR',".") + "/" 

    bot = IACAgentBot(pipeline_location + "pipelines/task_agent.json", 
                      pipeline_location + "pipelines/planning_agent.json", special_api_location)
    print(event)
    taskData = json.loads(event.get('message','{}'))
    print('Task Data is:')
    print(taskData)
    print(taskData.get('is_user_task'))
    if(taskData.get('is_user_task')):
        action = 'task'
    else:
        action = 'plan'
    if taskData.get('depth') is None:
        taskData['depth'] = 0
    if(event.get('textInput') is not None):
        taskData['textMessage'] = event.get('textInput')
    plan_type = event.get('plan_type', 'system1')
    outputs , agentTask, plan_type, new_depth = bot.run_task(action, taskData , plan_type= plan_type  )
    message = json.dumps(outputs)
    parent = event.get('taskParentId')
    if agentTask == 'plan':
        parent = event.get('parentId')



    result_json = {
        'senderId' : event.get('senderId'),
        'message' : message,
        'botConfigId' : "",
        'agentTask' : agentTask,
        'systemType' : plan_type,
        'depth' : new_depth,
        "conversationId" : event.get('conversationId'),
        'runId' : event.get('runId'),
        'tool_call_id' : event.get('tool_call_id')
    }
    if event.get('planId'):
       result_json['planId'] = event.get('planId')
    
    if parent is not None:
        result_json['parentId'] = parent
    
    thread_id = event.get('threadId')
    if thread_id is None:
        thread_id = str(uuid.uuid4())
    result_json['threadId'] = thread_id
    if event.get('convoId') is not None:
        result_json['convoId'] = event.get('convoId')
    

    print(result_json)

    result =  requests.post( 
        event.get('planner_webhook'), 
        headers = {'Content-Type' : 'application/json'}, 
        data= json.dumps(result_json)
    )  

    if result.status_code == 200:
        print("Success")
    else:
        print(result.status_code)
        print(result.text)
    return result_json

    
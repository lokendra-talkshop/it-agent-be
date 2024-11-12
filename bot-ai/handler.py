import boto3
import os
from bot import Bot
import json
import requests
    

def handle(event):
    print("Loading Config")
    client = boto3.client('s3', aws_access_key_id = os.environ.get('AWS_ACCESS_KEY'), 
                          aws_secret_access_key = os.environ.get('AWS_SECRET_KEY'), region_name = 'us-east-2')
    botConfigId = event.get('botConfigId',os.environ.get('DEFAULT_BOT_CONFIG_ID'))
    botConfig = client.get_object(Bucket = os.environ.get('ROLE_PLAY_BOT_CONFIG_BUCKET'), Key = botConfigId)
    botConfig = json.loads(botConfig.get('Body').read())
    examples = []
    for example in botConfig.get('examples'):
         obj = client.get_object(Bucket = os.environ.get('ROLE_PLAY_BOT_EXAMPLE_BUCKET'), Key = example + ".json")
         examples.append(json.loads(obj.get('Body').read()))
    botConfig['examples'] = examples
    bot = Bot(botConfig)
    if event.get('stream'):
        tokens = bot.stream(event.get('textInput'), event.get('threadId') , event.get('botId'))
        for token in tokens:
             data = {
                'senderId' : event.get('senderId'),
                'message' : token.get('text'),
                'messageId' : token.get('messageId'),
                'thread_id' : token.get('threadId')
             }
             result = requests.post(event.get('webhook') , headers = {'Content-Type' : 'application/json'}, data= json.dumps(data))
        return 
    text, thread_id = bot.run(event.get('textInput'), event.get('threadId'), event.get('botId'), event.get('attachments',[]))
    result_json = {
        'senderId' : event.get('senderId'),
        'message' : text,
        'botConfigId' : botConfigId
    }
    if thread_id is not None:
        result_json['thread_id'] = thread_id
    if event.get('convoId') is not None:
        result_json['convoId'] = event.get('convoId')
    result =  requests.post(event.get('webhook'), headers = {'Content-Type' : 'application/json'}, data= json.dumps(result_json))  
    
    if result.status_code == 200:
        print("Success")
    else:
        print(result.status_code)
        print(result.text)
    return result_json

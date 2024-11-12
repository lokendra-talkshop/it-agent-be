import boto3
import handler 
import json
import traceback
def handle(event, context):
    event =  json.loads(event['Records'][0].get('body'))
    try:
       print("Starting to run")
       handler.handle(event, context)
    except Exception as e:
        print(traceback.format_exc())
        print(e)

    
    
       

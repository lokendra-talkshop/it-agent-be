import boto3
import os
import json

from handler import handle

# Initialize the SQS client
sqs = boto3.client('sqs', region_name=os.environ.get('REGION', 'eu-east-2'))

# The URL of the SQS queue
queue_url = os.environ.get('SQS_QUEUE_URL')

print(queue_url)


def poll_sqs_queue():
    print("Starting to recieve messages")
    while True:
        # Receive a message from the SQS queue
        response = sqs.receive_message(
            QueueUrl=queue_url,
            AttributeNames=['All'],
            MaxNumberOfMessages=1,
            WaitTimeSeconds=20  # Enable long polling
        )
        
        messages = response.get('Messages', [])
        
        if messages:
            for message in messages:
                # Extract the message body
                message_body = json.loads(message['Body'])
                print("Recieved Task")
                print(message_body)
                try:
                   # Call the demo function
                    handle(message_body)
                    
                    # Delete the message from the queue after processing
                    sqs.delete_message(
                       QueueUrl=queue_url,
                       ReceiptHandle=message['ReceiptHandle']
                    )
       
                except Exception as e:
                    print(e)
                    print("Could not handle the event")
                    s3Client = boto3.client('s3', region_name = 'us-east-2')
                    s3Client.put_object(Bucket = "ai-bot-errors",  Key = "error.log", Body = repr(e))
if __name__ == '__main__':
    print("Starting to poll the SQS queue")
    poll_sqs_queue()

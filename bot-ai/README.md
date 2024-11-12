To deploy a lambda

bash deploy-lambda-dev AGENT_NAME LAMBDA_VERSION GITUSER GITPASS AWS_PROFILE

AGENT_NAME must be the name of the folder in /lambdas

AWS_PROFILE a aws sso profile

You need to be logged into the role-play-bot-dev docker repository

Outputs
==========================================================

Chat Agent  (Orchestrator)
{
    message : "User Message is usually a text string to be sent back to the user",
    senderId : "The sender id (socket id of the user),
    conversationId : The id of the current conversation
    threadId : The id of the thread (used for openai asistants etc langchain agent tool (grok))   
}

Tool Agents (Codegen/Code execution)
{
  threadId: Thread of the conversation, 
  runId": Open AI run id, 
  conversationId: the conversation ID of the current conversation, 
  agent": the name of the agent to call. This is the key in the dynamo db, 
  tool_call_id: agent tool call id (open ai assistants), 
  message: JSON string containing the message payload that needs to be sent to the agent being requested

}



Inputs
==========================================================

The queue messages must take the following form 
Chat agent 

{
   'textInput' : 'The text to be sent in there',
   'tool_call_id' : The tool call id  //optional only for after a tool has given results
   'tool_outputs' : The payload of the tool  //optional only for after a tool has given results
   'senderId' : The socket id of the sender,
   'conversationId' : The id of the conversation 
   'runId' : The id of the current run //optional used for tool calls
   'threadId' : The id of the thread . //optional used for history, when the first call is made this is blank
   'agent_webhook' : The webhook for agent tools (used to send input to the tools),
   'webhook' : The webhook for the chat agent (used to get output from the chat agent) 

}

Code Gen Agent
{

   'message': parameters from the chat agent . json string containing json that should have the form {'task' : .... , 'tools' : ... },
   'tool_call_id' : The tool call id  //optional only for after a tool has given results
   'senderId' : The socket id of the sender,
   'conversationId' : The id of the conversation 
   'runId' : The id of the current run //optional used for tool calls
   'threadId' : The id of the thread . //optional used for history, when the first call is made this is blank
   'webhook' : The webhook for the codegen agent (used to get output from the codegen agent) // This is a tool output webhook which then has to be sent back to the chat agent 
}

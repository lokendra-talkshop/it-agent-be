FROM amd64/amazonlinux:latest as intermediate
LABEL stage=intermediate

ARG GIT_PASS
ARG GIT_USER

RUN yum install -y git 

RUN git clone https://$GIT_USER:$GIT_PASS@github.com/TalkShopClub/SearchUtils.git #hello37

FROM public.ecr.aws/lambda/python:3.12

COPY --from=intermediate SearchUtils ${LAMBDA_TASK_ROOT}/SearchUtils

WORKDIR ${LAMBDA_TASK_ROOT}/SearchUtils

RUN pip install -r requirements_llm.txt

RUN pip install -e .

WORKDIR ${LAMBDA_TASK_ROOT}

COPY requirements.txt ${LAMBDA_TASK_ROOT}

RUN pip install -r requirements.txt

RUN echo "hello6" 

RUN pip install -U duckduckgo-search

COPY agents/special_api.json ${LAMBDA_TASK_ROOT}/special_api.json

COPY pipelines  ${LAMBDA_TASK_ROOT}/pipelines

COPY agents/memory.py ${LAMBDA_TASK_ROOT}/agents/memory.py
COPY agents/chat_agent.py ${LAMBDA_TASK_ROOT}/agents/chat_agent.py
COPY agents/planning_agent.py ${LAMBDA_TASK_ROOT}/agents/planning_agent.py
COPY agents/task_agent.py ${LAMBDA_TASK_ROOT}/agents/task_agent.py



COPY tools/code_execution.py ${LAMBDA_TASK_ROOT}/tools/code_execution.py
COPY tools/code_generator.py ${LAMBDA_TASK_ROOT}/tools/code_generator.py
COPY tools/memory_tool.py ${LAMBDA_TASK_ROOT}/tools/memory_tool.py
COPY tools/interpreter.py ${LAMBDA_TASK_ROOT}/tools/interpreter.py
COPY tools/planner.py ${LAMBDA_TASK_ROOT}/tools/planner.py


COPY llm.py ${LAMBDA_TASK_ROOT}/llm.py

COPY lambdas/Chat/handler.py ${LAMBDA_TASK_ROOT}/handler.py
COPY lambdas/Chat/lambda_handler.py ${LAMBDA_TASK_ROOT}/lambda_handler.py
COPY lambdas/Chat/infrabot.json ${LAMBDA_TASK_ROOT}/infrabot.json




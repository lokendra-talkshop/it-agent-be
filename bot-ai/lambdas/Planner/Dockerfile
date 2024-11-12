FROM amd64/amazonlinux:latest as intermediate
LABEL stage=intermediate

ARG GIT_PASS
ARG GIT_USER

RUN yum install -y git 

RUN git clone https://$GIT_USER:$GIT_PASS@github.com/TalkShopClub/SearchUtils.git #hello38

FROM public.ecr.aws/lambda/python:3.12

COPY --from=intermediate SearchUtils ${LAMBDA_TASK_ROOT}/SearchUtils

WORKDIR ${LAMBDA_TASK_ROOT}/SearchUtils

RUN pip install -r requirements_llm.txt

RUN pip install -e .

WORKDIR ${LAMBDA_TASK_ROOT}

COPY requirements.txt ${LAMBDA_TASK_ROOT}

RUN pip install -r requirements.txt

RUN echo "hello6" 

COPY agents/special_api.json ${LAMBDA_TASK_ROOT}/special_api.json

COPY pipelines  ${LAMBDA_TASK_ROOT}/pipelines

COPY agents/task_agent.py ${LAMBDA_TASK_ROOT}/agents/task_agent.py
COPY agents/planning_agent.py ${LAMBDA_TASK_ROOT}/agents/planning_agent.py
COPY agents/memory.py ${LAMBDA_TASK_ROOT}/agents/memory.py


COPY llm.py ${LAMBDA_TASK_ROOT}/llm.py

COPY lambdas/Planner/lambda_handler.py ${LAMBDA_TASK_ROOT}/lambda_handler.py
COPY lambdas/Planner/handler.py ${LAMBDA_TASK_ROOT}/handler.py
COPY lambdas/Planner/bot.py ${LAMBDA_TASK_ROOT}/bot.py



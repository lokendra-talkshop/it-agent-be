FROM amd64/amazonlinux:2023 as intermediate
LABEL stage=intermediate

ARG GIT_PASS
ARG GIT_USER

RUN yum install -y git 

RUN git clone https://$GIT_USER:$GIT_PASS@github.com/TalkShopClub/SearchUtils.git #hello39

FROM amd64/amazonlinux:2023

COPY --from=intermediate SearchUtils /app/SearchUtils

WORKDIR /app/SearchUtils

RUN yum install -y python3 python3-pip
RUN yum install -y python3-setuptools


RUN pip3 install -r requirements_llm.txt

RUN pip3 install -e .

WORKDIR /app

COPY requirements.txt /app/

RUN pip3 install --no-cache-dir -r requirements.txt

RUN pip3 install duckduckgo_search

COPY bot.py /app/
COPY task.py /app/
COPY handler.py /app/


CMD ["python3", "task.py"]


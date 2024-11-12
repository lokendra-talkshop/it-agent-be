VERSION=${1}
GITUSER=${2}
GITPASS=${3}
docker build -t role-play-bot-ai-dev:${VERSION} --build-arg=GIT_USER=${GITUSER} --build-arg=GIT_PASS=${GITPASS} -f Dockerfile .
docker tag role-play-bot-ai-dev:${VERSION} 129875285541.dkr.ecr.us-east-2.amazonaws.com/role-play-bot-ai-dev:${VERSION}
docker push 129875285541.dkr.ecr.us-east-2.amazonaws.com/role-play-bot-ai-dev:${VERSION}

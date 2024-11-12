LAMBDA=${1}
VERSION=${2}
GITUSER=${3}
GITPASS=${4}
PROFILE=${5}
LAMBDA_TAG=`echo ${LAMBDA} | tr '[:upper:]' '[:lower:]'`

docker build --platform=linux/amd64  -t role-play-bot-ai-dev:${LAMBDA_TAG}-${VERSION} --build-arg=GIT_USER=${GITUSER} --build-arg=GIT_PASS=${GITPASS} -f lambdas/${LAMBDA}/Dockerfile .
docker tag role-play-bot-ai-dev:${LAMBDA_TAG}-${VERSION} 129875285541.dkr.ecr.us-east-2.amazonaws.com/role-play-bot-ai-dev:lambda-${LAMBDA_TAG}-${VERSION}
docker push 129875285541.dkr.ecr.us-east-2.amazonaws.com/role-play-bot-ai-dev:lambda-${LAMBDA_TAG}-${VERSION}
FUNCTION_NAME=InfraBot${LAMBDA}Dev
aws lambda update-function-code --function-name ${FUNCTION_NAME} --image-uri 129875285541.dkr.ecr.us-east-2.amazonaws.com/role-play-bot-ai-dev:lambda-${LAMBDA_TAG}-${VERSION} --profile ${PROFILE}

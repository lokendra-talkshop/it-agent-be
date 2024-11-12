import { NotImplementedError } from '../node-utils';

const common = {
  countryCodeRegex: /^(\+?\d{1,3}|\d{1,4})$/,
  phoneNumberRegex: /^\d{5,15}$/,
  unicodeRegex: /U\+[0-9A-Fa-f]{4,6}/,
  otpLength: 4,
  otpMaxRetry: 3,
  otpRegex: /^\d{4}$/,
  // move to environment variable
  apple_otp_code: '0812',
};

const getDebateConfigurations = () => {};

const appConfig = {
  userBucket: `role-play-bot-user-images${
    process.env.ENVIRONMENT === 'dev' || process.env.ENVIRONMENT === 'development' ? '-dev' : ''
  }`,

  ...common,
  ...(() => {
    if (!process.env.ENVIRONMENT || process.env.ENVIRONMENT === 'dev' || process.env.ENVIRONMENT === 'local') {
      return {
        env: process.env.ENVIRONMENT || 'dev',
        baseURL:  process.env.ENVIRONMENT == 'local' ? 'http://localhost:5000' : 'https://bot-api.onlybantsapp.com',
        user_images_distribution: 'd3cbfrsomho55h',
        webview_base_url: process.env.ENVIRONMENT == 'local'  ? 'http://localhost:3000'  : 'http://ec2-3-145-108-91.us-east-2.compute.amazonaws.com:3011',
        bot_config_bucket : 'role-play-bot-configs-dev',
        chat_bot_queue : "https://sqs.us-east-2.amazonaws.com/129875285541/role-play-bot-message-dev",
        user_images_bucket : "role-play-bot-user-images-dev",
        attachment_bucket : "role-play-bot-user-attachments-dev",
        aws_region : "us-east-2",
        agent_configuration_table : "InfrabotServiceAgentConfigurationDev",
        queue_prefix : `https://sqs.us-east-2.amazonaws.com/129875285541`,
        QUEUES: {
          chat_agent_queue: 'https://sqs.us-east-2.amazonaws.com/129875285541/infrabot-chat-agent-dev',
          tool_agent_queue: 'https://sqs.us-east-2.amazonaws.com/129875285541/infrabot-tool-agent-dev',
          planner_agent_queue: 'https://sqs.us-east-2.amazonaws.com/129875285541/infrabot-planner-agent-dev',
          code_gen_agent_queue: 'https://sqs.us-east-2.amazonaws.com/129875285541/infrabot-codgen-agent-dev',
        },
        LAMBDAS: {
          InfraBotChatDev: 'arn:aws:lambda:us-east-2:129875285541:function:InfraBotChatDev',
          InfraBotPlannerDev: 'arn:aws:lambda:us-east-2:129875285541:function:InfraBotPlannerDev',
          InfraBotCodeGenDev: 'arn:aws:lambda:us-east-2:129875285541:function:InfraBotCodeGenDev',
        }
      };
    }
    if (process.env.ENVIRONMENT === 'prod') {
      return {
        baseURL: 'https://prod-api.onlybantsapp.com',
        user_images_distribution: '',
        webview_base_url: 'https://prod-webview-app.onlybantsapp.com/debate',
        chat_bot_queue : "https://sqs.us-east-2.amazonaws.com/129875285541/role-play-bot-message-prod",
        bot_config_bucket : 'role-play-bot-configs',
        user_images_bucket : 'role-play-bot-user-images',
        aws_region : "us-east-2",
        agent_configuration_table : "InfrabotServiceAgentConfigurationDev",
        queue_prefix : `https://sqs.us-east-2.amazonaws.com/129875285541`,
        QUEUES: {
          chat_agent_queue: 'https://sqs.us-east-2.amazonaws.com/129875285541/infrabot-chat-agent-dev',
          tool_agent_queue: 'https://sqs.us-east-2.amazonaws.com/129875285541/infrabot-tool-agent-dev',
          planner_agent_queue: 'https://sqs.us-east-2.amazonaws.com/129875285541/infrabot-planner-agent-dev',
          code_gen_agent_queue: 'https://sqs.us-east-2.amazonaws.com/129875285541/infrabot-codgen-agent-dev',
        },
        LAMBDAS: {
          InfraBotChatDev: 'arn:aws:lambda:us-east-2:129875285541:function:InfraBotChatDev',
          InfraBotPlannerDev: 'arn:aws:lambda:us-east-2:129875285541:function:InfraBotPlannerDev',
          InfraBotCodeGenDev: 'arn:aws:lambda:us-east-2:129875285541:function:InfraBotCodeGenDev',
        }
      };
    }
    throw new NotImplementedError('ENV not implemented');
  })(),
};

export default appConfig;

import {DynamoDbReader} from "../services/dynamoDB-manager";
import appConfig from "../configs";

async function getToolQueue({ agent }) {
    const reader = new DynamoDbReader(appConfig.aws_region, appConfig.agent_configuration_table)
    const config = await reader.getItem({
        service: agent.toLowerCase()
    })

    console.log("config");
    console.log(config);

    return config ? appConfig.queue_prefix + "/" + config.service_queue: undefined;
}

export default {
    getToolQueue,
}
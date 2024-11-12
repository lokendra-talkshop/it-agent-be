import {S3ObjectReader} from "../services/s3-media";

function extractS3BucketDetailsFromURL(url) {
    return url.replace("s3://", "").split("/");
}

async function getBotConfigDataFromUrl(url) {
    const [bucket, key] = extractS3BucketDetailsFromURL(url);
    console.log("Bucket");
    console.log(bucket);
    console.log("Key");
    console.log(key);
    const configFile = await S3ObjectReader.getObjectData(key, bucket);
    return {
        key,
        bucket,
        configData: JSON.parse(configFile)
    };
}

function getParsedJSONIfPossible(str) {
    try {
        return JSON.parse(str);
    } catch (e) {
        return {};
    }
}


function convertTaskTreeOutput(taskTree){
    const taskData = getParsedJSONIfPossible(taskTree.taskData);
    return {
        ...taskData,
        ...(Array.isArray(taskTree.children) && {
            children: taskTree.children.map(convertTaskTreeOutput)
        }),
    }
}



export default {
    extractS3BucketDetailsFromURL,
    getBotConfigDataFromUrl,
    getParsedJSONIfPossible,
    convertTaskTreeOutput
}
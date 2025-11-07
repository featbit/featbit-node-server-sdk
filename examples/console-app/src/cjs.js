const { DataSyncModeEnum, FbClientBuilder, UserBuilder, BasicLogger } = require('@featbit/node-server-sdk');
const { format } = require("util");
//import { DataSyncModeEnum, FbClientBuilder, IUser, UserBuilder } from "../../../src";

// use websocket streaming
// const fbClient = new FbClientBuilder()
//     .sdkKey('USE_YOUR_SDK_KEY')
//     .streamingUri('ws://localhost:5100')
//     .eventsUri('http://localhost:5100')
//     .logLevel('info')
//     .logger(new BasicLogger({
//         level: 'debug',
//         // eslint-disable-next-line no-console
//         destination: console.error,
//     }))
//     .disableEvents(true)
//     .build();

// use polling
const fbClient = new FbClientBuilder()
    .sdkKey('USE_YOUR_SERVER_SDK_KEY')
    .pollingUri('https://app-eval.featbit.co')
    .pollingInterval(5000)
    .dataSyncMode(DataSyncModeEnum.POLLING)
    //.logLevel('info')
    .logger(new BasicLogger({
        level: 'debug',
        // eslint-disable-next-line no-console
        destination: console.error,
        formatter: format,
    }))
    //.disableEvents(true)
    .eventsUri('https://app-eval.featbit.co')
    .build();

const flagKey = 'robot';

const user = new UserBuilder('anonymous').build();

// listen to flag update event
fbClient.on(`update:${flagKey}`, async () => {
    const variation = await fbClient.stringVariation(flagKey, user, 'aaa');
    console.log(`flag '${flagKey}' update event received, returns ${variation} for user ${user.key}`);
})

async function run() {
    try {
        await fbClient.waitForInitialization();
    } catch (err) {
        console.log(err);
    }

    const variationDetail = await fbClient.stringVariation(flagKey, user, 'aaa');
    console.log(`flag '${flagKey}' returns ${variationDetail.value} for user ${user.key} ` +
        `Reason Kind: ${variationDetail.kind}, Reason Description: ${variationDetail.reason}`);

    // make sure the events are flushed before exit
    await fbClient.flush();
}

run()
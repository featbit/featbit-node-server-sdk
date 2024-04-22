const {DataSyncModeEnum, FbClientBuilder, UserBuilder} = require('@featbit/node-server-sdk');
//import { DataSyncModeEnum, FbClientBuilder, IUser, UserBuilder } from "../../../src";

// use websocket streaming
// const fbClient = new FbClientBuilder()
//     .sdkKey('USE_YOUR_SDK_KEY')
//     .streamingUri('ws://localhost:5100')
//     .eventsUri('http://localhost:5100')
//     .build();

// use polling
const fbClient = new FbClientBuilder()
    .sdkKey('USE_YOUR_SDK_KEY')
    .pollingUri('http://localhost:5100')
    .pollingInterval(5000)
    .dataSyncMode(DataSyncModeEnum.POLLING)
    .eventsUri('http://localhost:5100')
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
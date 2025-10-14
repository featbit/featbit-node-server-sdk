//import { DataSyncModeEnum, FbClientBuilder, IUser, UserBuilder } from "@featbit/node-server-sdk";
import { FbClientBuilder, IUser, UserBuilder, DataSyncModeEnum } from "../../../src";

// use websocket streaming
// const fbClient = new FbClientBuilder()
//     .sdkKey('USE_YOUR_SDK_KEY')
//     .streamingUri('ws://localhost:5100')
//     .eventsUri('http://localhost:5100')
//     .disableEvents(true)
//     .build();

// use polling
const fbClient = new FbClientBuilder()
  .sdkKey('USE_YOUR_SERVER_SDK_KEY')
  .pollingUri('http://localhost:5100')
  .pollingInterval(5000)
  .dataSyncMode(DataSyncModeEnum.POLLING)
//.disableEvents(true)
  .eventsUri('http://localhost:5100')
  .build();

const flagKey = 'robot';

const user: IUser = new UserBuilder('anonymous').build();

// listen to flag update event
fbClient.on(`update:${flagKey}`, async () => {
  const variation = await fbClient.stringVariation(flagKey, user, 'abb');
  console.log(`flag '${flagKey}' update event received, returns ${variation} for user ${user.key}`);
})

async function run() {
  try {
    await fbClient.waitForInitialization();
  } catch (err) {
    console.log(err);
  }

  const boolVariationDetail = await fbClient.boolVariationDetail(flagKey, user, false);
  console.log(`flag '${flagKey}' returns ${boolVariationDetail.value} for user ${user.key} ` +
    `Reason Kind: ${boolVariationDetail.kind}, Reason Description: ${boolVariationDetail.reason}`);

  // make sure the events are flushed before exit
  await fbClient.flush();
}

run()

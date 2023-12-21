import { FbClientBuilder, IUser, UserBuilder } from "@featbit/node-server-sdk";

const fbClient = new FbClientBuilder()
  .sdkKey('use_your_sdk_key')
  .streamingUri('ws://localhost:5100')
  .eventsUri('http://localhost:5100')
  .build();

const flagKey = 'ff1';

const user: IUser = new UserBuilder()
  .anonymous('aa')
  .build();

// listen to flag update event
fbClient.on(`update:${flagKey}`,  (ee: any) => {
  const r2 = fbClient.boolVariation(flagKey, user, false);
  console.log(r2);
})

async function run() {
  try {
    await fbClient.waitForInitialization();
  } catch(err) {
    //console.log(err);
  }

  const boolVariationDetail = fbClient.boolVariationDetail(flagKey, user, false);
  console.log(`flag '${flagKey}' returns ${boolVariationDetail.value} for user ${user.key} ` +
    `Reason Kind: ${boolVariationDetail.kind}, Reason Description: ${boolVariationDetail.reason}`);

  // make sure the events are flushed before exit
  fbClient.close();
}

run()

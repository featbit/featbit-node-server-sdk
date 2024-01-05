# FeatBit Server-Side SDK for Node.js

## Introduction

This is the Node.js Server-Side SDK for the 100% open-source feature flags management platform [FeatBit](https://github.com/featbit/featbit).

The FeatBit Server-Side SDK for Node.js is designed primarily for use in multi-user systems such as web servers and applications. It is not intended for use in desktop and embedded systems applications.

## Data synchronization
We use **WebSocket** or **Polling** to make the local data synchronized with the server, and then store them in memory by default. Whenever there is any change to a feature flag or its related data, this change will be pushed to the SDK, the average synchronization time is less than **100ms**. Be aware the WebSocket/Polling connection may be interrupted due to internet outage, but it will be resumed automatically once the problem is gone.

## Get Started

### Installation
The latest stable version is available on [npm](https://www.npmjs.com/package/@featbit/node-server-sdk).

```bash
npm install --save @featbit/node-server-sdk
```
### Prerequisite

Before using the SDK, you need to obtain the environment secret (the sdkKey) and SDK URLs.

Follow the documentation below to retrieve these values
- [How to get environment secret](https://docs.featbit.co/sdk/faq#how-to-get-the-environment-secret)
- [How to get SDK URLs](https://docs.featbit.co/sdk/faq#how-to-get-the-sdk-urls)

### Quick Start

The following code demonstrates the basic usage of `@featbit/node-server-sdk`.

```javascript
import { FbClientBuilder } from "@featbit/node-server-sdk";

// setup SDK options
const fbClient = new FbClientBuilder()
    .sdkKey("your_sdk_key")
    .streamingUri('ws://localhost:5100')
    .eventsUri("http://localhost:5100")
    .build();

(async () => {
  // wait for the SDK to be initialized
  try {
    await fbClient.waitForInitialization();
  } catch(err) {
    // failed to initialize the SDK
    console.log(err);
  }

  // flag to be evaluated
  const flagKey = "game-runner";
  
  // create a user
  const user = new UserBuilder('a-unique-key-of-user')
    .name('bob')
    .custom('sex', 'female')
    .custom('age', 18)
    .build();

  // evaluate a feature flag for a given user
  const boolVariation = await fbClient.boolVariation(flagKey, user, false);
  console.log(`flag '${flagKey}' returns ${boolVariation} for user ${user.Key}`);

  // evaluate a boolean flag for a given user with evaluation detail
  const boolVariationDetail = await fbClient.boolVariationDetail(flagKey, user, false);
  console.log(`flag '${flagKey}' returns ${boolVariationDetail.value} for user ${user.Key}` +
  `Reason Kind: ${boolVariationDetail.kind}, Reason Description: ${boolVariationDetail.reason}`);

  // make sure the events are flushed before exit
  await fbClient.close();
})();
```

## Examples
- [Console App](./examples/console-app)

## SDK

### FbClientNode

The `FbClientNode` is the heart of the SDK which provides access to FeatBit server. Applications should instantiate a single instance for the lifetime of the application.

`FbClientBuilder` is used to construct a `FbClientNode` instance. The builder exposes methods to configure the SDK, and finally to create the `FbClientNode` instance.

#### FbClient Using Streaming

```javascript
import { FbClientBuilder } from "@featbit/node-server-sdk";

const fbClient = new FbClientBuilder()
    .sdkKey("your_sdk_key")
    .streamingUri('ws://localhost:5100')
    .eventsUri("http://localhost:5100")
    .build();
```
#### FbClient Using Polling

```javascript
import { FbClientBuilder, DateSyncMode } from "@featbit/node-server-sdk";

const fbClient = new FbClientBuilder()
    .sdkKey("your_sdk_key")
    .dataSyncMode(DateSyncMode.POLLING)
    .pollingUri('http://localhost:5100')
    .eventsUri("http://localhost:5100")
    .pollingInterval(10000)
    .build();
```

#### IUser

IUser defines the attributes of a user for whom you are evaluating feature flags. IUser has two built-in attributes: key and name. The only mandatory attribute of a IUser is the key, which must uniquely identify each user.

Besides these built-in properties, you can define any additional attributes associated with the user using `custom(string key, string value)` method on UserBuilder. Both built-in attributes and custom attributes can be referenced in targeting rules, and are included in analytics data.

UserBuilder is used to construct a `IUser` instance. The builder exposes methods to configure the IUser, and finally to create the IUser instance.

```javascript
import { UserBuilder } from "@featbit/node-server-sdk";

const bob = new UserBuilder("unique_key_for_bob")
    .name("Bob")
    .custom('age', 18)
    .custom('country', 'FR')
    .build();
```

### Evaluating flags

By using the feature flag data it has already received, the SDK **locally calculates** the value of a feature flag for a
given user.

There is a `Variation` method that returns a flag value, and a `VariationDetail` method that returns an object
describing how the value was determined for each type.

- boolVariation/boolVariationDetail
- stringVariation/stringVariationDetail
- numberVariation/numberVariationDetail
- jsonVariation/jsonVariationDetail

Variation calls take the feature flag key, a IUser, and a default value. If any error makes it impossible to
evaluate the flag (for instance, the feature flag key does not match any existing flag), default value is returned.

```javascript
// flag to be evaluated
const flagKey = "game-runner";

// create a user
const user = new UserBuilder('a-unique-key-of-user')
    .name('bob')
    .custom('sex', 'female')
    .custom('age', 18)
    .build();

// evaluate a feature flag for a given user
const boolVariation = await fbClient.boolVariation(flagKey, user, false);
console.log(`flag '${flagKey}' returns ${boolVariation} for user ${user.Key}`);

// evaluate a boolean flag for a given user with evaluation detail
const boolVariationDetail = await fbClient.boolVariationDetail(flagKey, user, false);
console.log(`flag '${flagKey}' returns ${boolVariationDetail.value} for user ${user.Key}` +
    `Reason Kind: ${boolVariationDetail.kind}, Reason Description: ${boolVariationDetail.reason}`);
```

### Offline Mode

In some situations, you might want to stop making remote calls to FeatBit. Here is how:
```javascript
import { FbClientBuilder } from "@featbit/node-server-sdk";

const fbClient = new FbClientBuilder()
    .offline(true)
    .build();

```

> **_NOTE:_** Populating data from a JSON string is only supported in offline mode.

The format of the data in flags and segments is defined by FeatBit and is subject to change. Rather than trying to
construct these objects yourself, it's simpler to request existing flags directly from the FeatBit server in JSON format
and use this output as the starting point for your file. Here's how:

```shell
# replace http://localhost:5100 with your evaluation server url
curl -H "Authorization: <your-env-secret>" http://localhost:5100/api/public/sdk/server/latest-all > featbit-bootstrap.json
```

Then use that file to initialize FbClient:
```javascript
import { FbClientBuilder } from "@featbit/node-server-sdk";
import fs from 'fs';

let data: string = '';
try {
  data = fs.readFileSync('path_to_the_json_file', 'utf8');
} catch (err) {
  console.error(err);
}

const fbClient = new FbClientBuilder()
    .offline(false)
    .useJsonBootstrapProvider(data)
    .build();
```

### Experiments (A/B/n Testing)

We support automatic experiments for pageviews and clicks, you just need to set your experiment on our SaaS platform,
then you should be able to see the result in near real time after the experiment is started.

In case you need more control over the experiment data sent to our server, we offer a method to send custom event.

```javascript
fbClient.track(user, eventName, numericValue);
```

**numericValue** is not mandatory, the default value is **1.0**.

Make sure `track` is called after the related feature flag is called, otherwise the custom event won't be included
into the experiment result.

## Supported Node.js versions

This version of the SDK should work for the recent versions of Node.js, if you see any issues with a specific version,
please create an issue.

## Getting support
- If you have a specific question about using this sdk, we encourage you
  to [ask it in our slack](https://join.slack.com/t/featbit/shared_invite/zt-1ew5e2vbb-x6Apan1xZOaYMnFzqZkGNQ).
- If you encounter a bug or would like to request a
  feature, [submit an issue](https://github.com/featbit/dotnet-server-sdk/issues/new).

## See Also
- [Connect To Node.js Sdk](https://docs.featbit.co/getting-started/connect-an-sdk#node.js)
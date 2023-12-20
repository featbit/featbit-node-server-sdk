# FeatBit Server-Side SDK for <Language>

## Introduction

This is the <Language> Server-Side SDK for the 100% open-source feature flags management platform [FeatBit](https://github.com/featbit/featbit).

The FeatBit Server-Side SDK for <Language> is designed primarily for use in multi-user systems such as web servers and applications. It is not intended for use in desktop and embedded systems applications.

## Data synchonization
We use **websocket** to make the local data synchronized with the server, and then store them in memory by default. Whenever there is any change to a feature flag or its related data, this change will be pushed to the SDK, the average synchronization time is less than **100ms**. Be aware the websocket connection may be interrupted due to internet outage, but it will be resumed automatically once the problem is gone.

## Get Started

### Installation

### Quick Start

The following code demonstrates the basic usage of <FeatBit.ServerSdk>.

1. how to create client
2. how to get flag variation
3. make sure event sent

### Examples
- Console
- WebApp

## SDK

### \<FbClient>

The FbClient is the heart of the SDK which providing access to FeatBit server. Applications should instantiate a single instance for the lifetime of the application.

In the case where an application needs to evaluate feature flags from different environments, you may create multiple clients, but they should still be retained for the lifetime of the application rather than created per request or per thread.

#### \<Config>

<how to create client with complete config, with code block>

### Bootstrapping

\<introduction>

### Offline Mode

\<introduction>

### \<FbUser>

<FbUser> defines the attributes of a user for whom you are evaluating feature flags. <FbUser> has two built-in attributes: \<key and name>. The only mandatory attribute of a <FbUser> is the key, which must uniquely identify each user.

Besides these built-in properties, you can define any additional attributes associated with the user using <Custom(string key, string value)> method on <IFbUserBuilder>. Both built-in attributes and custom attributes can be referenced in targeting rules, and are included in analytics data.

### Evaluation

By using the feature flag data it has already received, the SDK **locally calculates** the value of a feature flag for a given user.

There is a `Variation` method that returns a flag value, and a `VariationDetail` method that returns an object describing how the value was determined for each type.

### Experiments (A/B/n Testing)

\<introduction> and \<how to send event>

## Getting support
- If you have a specific question about using this sdk, we encourage you
  to [ask it in our slack](https://join.slack.com/t/featbit/shared_invite/zt-1ew5e2vbb-x6Apan1xZOaYMnFzqZkGNQ).
- If you encounter a bug or would like to request a feature, \<submit an issue>.

## See Also
- [FeatBit in 3 minutes](https://featbit.gitbook.io/docs/getting-started/1.-featbit-in-3-minutes)
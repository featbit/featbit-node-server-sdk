import { createEvaluationServerMock } from "../../createEvaluationServerMock";
import { WebSocketServer } from "ws";
import { TestLogger } from "../../../src/integrations";
import { FbClientBuilder, UserBuilder } from "../../../src";

// all tests would pass in this module, but we got some weired logs
// so temporarily this test suite is skipped. To enable it, remove testPathIgnorePatterns in jest.config.js
describe('given a FbClientNode', () => {
  let wss: WebSocketServer;
  let testLogger: TestLogger;

  beforeEach(() => {
    testLogger = new TestLogger();
  });

  beforeAll(async () => {
    wss = createEvaluationServerMock();
  });

  afterAll(async () => {
    wss.close();
  });

  it('the fbClient initialized successfully', async () => {
    const fbClient = new FbClientBuilder()
      .sdkKey('sdk-key')
      .streamingUri('ws://localhost:6100')
      .eventsUri('http://localhost:6100')
      .logger(testLogger)
      .build();

    await fbClient.waitForInitialization();
    expect(fbClient.initialized()).toBe(true);
    await fbClient.close();
  });

  it('the fbClient initialized failed', async () => {
    const fbClient = new FbClientBuilder()
      .sdkKey('sdk-key')
      .streamingUri('ws://localhost1:6100')
      .startWaitTime(100)
      .eventsUri('http://localhost1:6100')
      .logger(testLogger)
      .build();

    try {
      await fbClient.waitForInitialization();
    } catch(err) {
    }
    expect(fbClient.initialized()).toBeFalsy();
    await fbClient.close();
  });

  it('get variation', async () => {
    const fbClient = new FbClientBuilder()
      .sdkKey('sdk-key')
      .streamingUri('ws://localhost:6100')
      .eventsUri('http://localhost1:6100')
      .logger(testLogger)
      .build();

    try {
      await fbClient.waitForInitialization();
    } catch(err) {
    }

    expect(fbClient.initialized()).toBeTruthy();
    const user = new UserBuilder().key('u1').build();
    const variation = await fbClient.boolVariation('example-flag', user, true);

    expect(variation).toEqual(true);
  });

  it('get variation detail', async () => {
    const fbClient = new FbClientBuilder()
      .sdkKey('sdk-key')
      .streamingUri('ws://localhost:6100')
      .eventsUri('http://localhost1:6100')
      .logger(testLogger)
      .build();

    try {
      await fbClient.waitForInitialization();
    } catch(err) {
    }

    expect(fbClient.initialized()).toBeTruthy();
    const user = new UserBuilder().key('u1').build();
    const variationDetail = await fbClient.boolVariationDetail('example-flag', user, true);

    expect(variationDetail.value).toBe(true);
    expect(variationDetail.reason).toBe('fall through targets and rules');
    expect(variationDetail.kind).toBe('FallThrough');
  });

  it('get all variations', async () => {
    const fbClient = new FbClientBuilder()
      .sdkKey('sdk-key')
      .streamingUri('ws://localhost:6100')
      .eventsUri('http://localhost1:6100')
      .logger(testLogger)
      .build();

    try {
      await fbClient.waitForInitialization();
    } catch(err) {
    }

    expect(fbClient.initialized()).toBeTruthy();
    const user = new UserBuilder().key('u1').build();
    const results = await fbClient.getAllVariations(user);

    expect(results.length).toBe(1);
    const result0 = results[0];

    expect(result0.value).toBe('true');
    expect(result0.reason).toBe('fall through targets and rules');
    expect(result0.kind).toBe('FallThrough');
  });
});
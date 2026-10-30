import { FbClientCore } from '../src/FbClientCore';
import { IFlag } from '../src/evaluation/data/IFlag';
import { ReasonKinds } from '../src/evaluation/ReasonKinds';
import { DefaultEventProcessor } from '../src/events/DefaultEventProcessor';
import { EvalEvent, MetricEvent } from '../src/events/event';
import { FlagBuilder } from '../src/integrations/test_data/FlagBuilder';
import { UserBuilder } from '../src';
import NodePlatform from '../src/platform/node/NodePlatform';
import { IDataSourceUpdates } from '../src/store/IDataSourceUpdates';
import { createPutListener, createPatchListener } from '../src/data-sources/createStreamListeners';

jest.mock('../src/events/DefaultEventProcessor');

describe('per-flag evaluation insights', () => {
  let client: FbClientCore;
  let updates: IDataSourceUpdates;
  let record: jest.Mock;
  const user = new UserBuilder('user').build();
  const rollout = [{id: 'on', rollout: [0, 1] as [number, number], exptRollout: 1}];

  function makeFlag(insightsEnabled?: boolean): IFlag {
    const flag = new FlagBuilder()
      .key('flag')
      .variations([{id: 'on', value: 'true'}])
      .disabledVariationId('on')
      .fallthrough({dispatchKey: '', includedInExpt: true, variations: rollout})
      .build();
    flag.updatedAt = '2026-10-30T00:00:00Z';
    if (insightsEnabled !== undefined) {
      flag.insightsEnabled = insightsEnabled;
    }
    return flag;
  }

  async function put(flag: IFlag) {
    const listener = createPutListener(updates);
    await listener.processJson(listener.deserializeData([flag], []));
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    client = new FbClientCore({
      sdkKey: 'test-key',
      streamingUri: 'ws://localhost',
      eventsUri: 'http://localhost',
      dataSynchronizer: (_context, _store, dataUpdates, ready) => {
        updates = dataUpdates;
        return {start: ready, close: jest.fn()};
      }
    }, new NodePlatform({}), {
      onError: jest.fn(), onFailed: jest.fn(), onReady: jest.fn(),
      onUpdate: jest.fn(), hasEventListeners: () => false
    });
    record = (DefaultEventProcessor as jest.MockedClass<typeof DefaultEventProcessor>)
      .mock.instances[0].record as jest.Mock;
  });

  afterEach(async () => {
    await client.close();
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  describe.each([false, true, undefined])('insightsEnabled=%s', insightsEnabled => {
    it.each(['off', 'target', 'rule', 'fallthrough'])('preserves %s evaluation and controls events', async path => {
      const flag = makeFlag(insightsEnabled);
      const kinds: Record<string, ReasonKinds> = {
        off: ReasonKinds.Off, target: ReasonKinds.TargetMatch,
        rule: ReasonKinds.RuleMatch, fallthrough: ReasonKinds.FallThrough
      };
      if (path === 'off') flag.isEnabled = false;
      if (path === 'target') flag.targetUsers = [{keyIds: [user.key], variationId: 'on'}];
      if (path === 'rule') flag.rules = [{
        id: 'rule', name: 'rule', conditions: [], dispatchKey: '', variations: rollout
      }];
      await put(flag);

      const result = await client.boolVariationDetail(flag.key, user, false);
      expect(result.value).toBe(true);
      expect(result.kind).toBe(kinds[path]);
      if (insightsEnabled === false) {
        expect(record).not.toHaveBeenCalled();
      } else {
        expect(record).toHaveBeenCalledTimes(1);
        expect(record).toHaveBeenCalledWith(expect.any(EvalEvent));
      }
    });
  });

  it('applies incremental changes and restores omitted-field behavior', async () => {
    await put(makeFlag(true));
    await client.boolVariation('flag', user, false);
    expect(record).toHaveBeenCalledTimes(1);

    const listener = createPatchListener(updates);
    for (const [index, enabled] of [false, true, false, undefined].entries()) {
      record.mockClear();
      const flag = makeFlag(enabled);
      flag.updatedAt = `2026-10-30T00:00:0${index + 1}Z`;
      await listener.processJson(listener.deserializeData([flag], []));
      expect(await client.boolVariation('flag', user, false)).toBe(true);
      expect(record).toHaveBeenCalledTimes(enabled === false ? 0 : 1);
    }
  });

  it('keeps custom metric tracking when flag insights are disabled', async () => {
    await put(makeFlag(false));
    await client.boolVariation('flag', user, false);
    client.track(user, 'purchase', 42);
    expect(record).toHaveBeenCalledTimes(1);
    expect(record).toHaveBeenCalledWith(expect.objectContaining({
      eventName: 'purchase', metricValue: 42, user
    }));
    expect(record.mock.calls[0][0]).toBeInstanceOf(MetricEvent);
  });
});

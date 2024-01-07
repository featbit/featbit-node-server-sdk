import crypto from "crypto";
import { IPlatform } from "../../src/platform/IPlatform";
import { IInfo } from "../../src/platform/IInfo";
import { IRequests } from "../../src/platform/requests";
import { IStore, IStoreDataStorage } from "../../src/store/store";
import InMemoryStore from "../../src/store/InMemoryStore";
import Evaluator from "../../src/evaluation/Evaluator";
import { UserBuilder } from "../../src";
import Context from "../../src/Context";
import { ReasonKinds } from "../../src/evaluation/ReasonKinds";
import { EmptyString } from "../../src/constants";
import { FlagBuilder } from "../../src/integrations/test_data/FlagBuilder";
import { deserializeAll } from "../../src/store/serialization";
import DataKinds from "../../src/store/DataKinds";
import { OperatorTypes } from "../../src/evaluation/operator";
import { ITargetRule } from "../../src/evaluation/data/IRule";
import { IFallthrough } from "../../src/evaluation/data/IFallthrough";


describe('given a Evaluator', () => {
  const platform: IPlatform = {
    crypto: crypto,
    info: {} as IInfo,
    requests: {} as IRequests
  };
  const store: IStore = new InMemoryStore();
  const evaluator = new Evaluator(platform, store);

  const defaultUser = new UserBuilder('u1').build();
  const defaultContext = Context.fromUser(defaultUser);

  it('evaluate flag not found', () => {
    const [evalResult, evalEvent] = evaluator.evaluate('hello', defaultContext);

    expect(evalResult.kind).toBe(ReasonKinds.FlagNotFound);
    expect(evalResult.value).toBe(EmptyString);
    expect(evalResult.reason).toBe('flag not found: hello');
  });

  it('evaluate malformed flag', () => {
    const malformedFlag = new FlagBuilder()
      .key('hello')
      .isEnabled(false)
      .disabledVariationId('not-exist-variation-id')
      .variations([{id: 'trueId', value: 'true'}])
      .build();
    const flagsAndSegments = deserializeAll([malformedFlag], []);
    const initData: IStoreDataStorage = {
      [DataKinds.Flags.namespace]: flagsAndSegments.flags,
      [DataKinds.Segments.namespace]: flagsAndSegments.segments,
    };
    store.init(initData, () => {});

    const [evalResult, evalEvent] = evaluator.evaluate('hello', defaultContext);

    expect(evalResult.kind).toBe(ReasonKinds.Error);
    expect(evalResult.value).toBe(EmptyString);
    expect(evalResult.reason).toBe('malformed flag');
  });

  it('evaluate flag off result', () => {
    const flag = new FlagBuilder()
      .key('hello')
      .isEnabled(false)
      .disabledVariationId('trueId')
      .variations([{id: 'trueId', value: 'true'}])
      .build();
    const flagsAndSegments = deserializeAll([flag], []);
    const initData: IStoreDataStorage = {
      [DataKinds.Flags.namespace]: flagsAndSegments.flags,
      [DataKinds.Segments.namespace]: flagsAndSegments.segments,
    };
    store.init(initData, () => {});

    const [evalResult, evalEvent] = evaluator.evaluate('hello', defaultContext);

    expect(evalResult.kind).toBe(ReasonKinds.Off);
    expect(evalResult.value).toBe('true');
    expect(evalResult.reason).toBe('flag off');

    // flag is off
    expect(evalEvent!.sendToExperiment).toBeFalsy();
  });

  it('evaluate targeted result', () => {
    const flag = new FlagBuilder()
      .key('hello')
      .isEnabled(true)
      .targetUsers([{keyIds: ['u1'], variationId: 'falseId'}])
      .variations([{id: 'trueId', value: 'true'}, {id: 'falseId', value: 'false'}])
      .build();
    const flagsAndSegments = deserializeAll([flag], []);
    const initData: IStoreDataStorage = {
      [DataKinds.Flags.namespace]: flagsAndSegments.flags,
      [DataKinds.Segments.namespace]: flagsAndSegments.segments,
    };
    store.init(initData, () => {});

    const [evalResult, evalEvent] = evaluator.evaluate('hello', defaultContext);

    expect(evalResult.kind).toBe(ReasonKinds.TargetMatch);
    expect(evalResult.value).toBe('false');
    expect(evalResult.reason).toBe('target match');

    // ExptIncludeAllTargets is true by default
    expect(evalEvent!.sendToExperiment).toBeTruthy();
  });

  it('evaluate rule matched result', () => {
    const customRule: ITargetRule = {
      id: 'xxx',
      name: 'open for vip & svip',
      conditions: [
        {
          id: 'xxx',
          property: 'vip',
          op: OperatorTypes.IsOneOf,
          value: "[\"vip\",\"svip\"]"
        }
      ],
      dispatchKey: 'keyId',
      includedInExpt: false,
      variations: [{
        id: 'trueId',
        exptRollout: 1,
        rollout: [0, 1]
      }]
    };
    const flag = new FlagBuilder()
      .key('hello')
      .isEnabled(true)
      .exptIncludeAllTargets(false)
      .variations([{id: 'trueId', value: 'true'}, {id: 'falseId', value: 'false'}])
      .rules([customRule])
      .build();
    const flagsAndSegments = deserializeAll([flag], []);
    const initData: IStoreDataStorage = {
      [DataKinds.Flags.namespace]: flagsAndSegments.flags,
      [DataKinds.Segments.namespace]: flagsAndSegments.segments,
    };
    store.init(initData, () => {});

    const context = Context.fromUser(
      new UserBuilder('u1')
        .custom('vip', 'svip')
        .build()
    );
    const [evalResult, evalEvent] = evaluator.evaluate('hello', context);

    expect(evalResult.kind).toBe(ReasonKinds.RuleMatch);
    expect(evalResult.value).toBe('true');
    expect(evalResult.reason).toBe(`match rule ${customRule.name}`);

    // customRule.IncludedInExpt is false
    expect(evalEvent!.sendToExperiment).toBeFalsy();
  });

  it('evaluate fallthrough result', () => {
    const fallthrough: IFallthrough = {
      dispatchKey: "keyId",
      includedInExpt: true,
      variations: [
        {
          id: "falseId",
          exptRollout: 1,
          rollout: [0, 1]
        }
      ]
    }

    const flag = new FlagBuilder()
      .key('hello')
      .isEnabled(true)
      .exptIncludeAllTargets(false)
      .fallthrough(fallthrough)
      .variations([{id: 'trueId', value: 'true'}, {id: 'falseId', value: 'false'}])
      .build();
    const flagsAndSegments = deserializeAll([flag], []);
    const initData: IStoreDataStorage = {
      [DataKinds.Flags.namespace]: flagsAndSegments.flags,
      [DataKinds.Segments.namespace]: flagsAndSegments.segments,
    };
    store.init(initData, () => {});

    const [evalResult, evalEvent] = evaluator.evaluate('hello', defaultContext);

    expect(evalResult.kind).toBe(ReasonKinds.FallThrough);
    expect(evalResult.value).toBe('false');
    expect(evalResult.reason).toBe('fall through targets and rules');

    // flag is on
    expect(evalEvent!.sendToExperiment).toBeTruthy();
  });
});
import crypto from 'crypto';
import Context from '../../src/Context';
import { UserBuilder } from '../../src';
import Evaluator from '../../src/evaluation/Evaluator';
import { isMatchRule } from '../../src/evaluation/evalRules';
import { OperatorTypes } from '../../src/evaluation/operator';
import { ReasonKinds } from '../../src/evaluation/ReasonKinds';
import { ITargetRule } from '../../src/evaluation/data/IRule';
import { ISegment } from '../../src/evaluation/data/ISegment';
import { FlagBuilder } from '../../src/integrations/test_data/FlagBuilder';
import { IPlatform } from '../../src/platform/IPlatform';
import { IInfo } from '../../src/platform/IInfo';
import { IRequests } from '../../src/platform/requests';
import InMemoryStore from '../../src/store/InMemoryStore';
import DataKinds from '../../src/store/DataKinds';
import { deserializeAll } from '../../src/store/serialization';

const context = Context.fromUser(new UserBuilder('user-key').build());
const ruleFor = (op: string, property = 'email', value = '@x.com'): ITargetRule => ({
  id: 'rule',
  name: 'email rule',
  conditions: [{ id: 'condition', property, op, value }],
  dispatchKey: 'keyId',
  variations: [{ id: 'matched', rollout: [0, 1], exptRollout: 1 }],
});

describe('missing attributes in evaluation', () => {
  it.each([...Object.values(OperatorTypes), 'UnknownOperator'])(
    '%s does not match a missing attribute', op => {
      expect(isMatchRule(new InMemoryStore(), ruleFor(op), context)).toBe(false);
    });

  it.each([null, undefined, '', '   '])('invalid property %s does not match', property => {
    const user = Context.fromUser(new UserBuilder('user-key').custom('   ', 'value').build());
    const rule = ruleFor(OperatorTypes.NotEqual);
    rule.conditions[0].property = property as unknown as string;
    expect(isMatchRule(new InMemoryStore(), rule, user)).toBe(false);
  });

  it('distinguishes an empty attribute from a missing attribute', () => {
    const rule = ruleFor(OperatorTypes.Equal, 'email', '');
    const emptyEmail = Context.fromUser(new UserBuilder('user-key').custom('email', '').build());
    expect(isMatchRule(new InMemoryStore(), rule, context)).toBe(false);
    expect(isMatchRule(new InMemoryStore(), rule, emptyEmail)).toBe(true);
  });

  describe.each([false, true])('condition inside segment: %s', insideSegment => {
    it.each([OperatorTypes.EndsWith, OperatorTypes.NotEqual, OperatorTypes.NotOneOf])(
      '%s continues to later rules or fallthrough', op => {
        const store = new InMemoryStore();
        const platform: IPlatform = { crypto, info: {} as IInfo, requests: {} as IRequests };
        const evaluator = new Evaluator(platform, store);
        const emailRule = ruleFor(op, 'email', op === OperatorTypes.NotOneOf ? '["@x.com"]' : '@x.com');
        const segments: ISegment[] = insideSegment ? [{
          id: 'segment', version: 1, included: [], excluded: [],
          rules: [emailRule], updatedAt: new Date().toISOString(),
        }] : [];
        const firstRule = insideSegment
          ? ruleFor('IsOneOf', 'User is in segment', '["segment"]')
          : emailRule;
        const laterRule = ruleFor(OperatorTypes.Equal, 'keyId', 'user-key');
        laterRule.id = 'later-rule';
        laterRule.name = 'later rule';
        laterRule.variations = [{ id: 'later', rollout: [0, 1], exptRollout: 1 }];

        for (const hasLaterRule of [false, true]) {
          const flag = new FlagBuilder().key('flag')
            .variations([
              { id: 'matched', value: 'email-match' },
              { id: 'later', value: 'later-match' },
              { id: 'default', value: 'default-rule' },
            ])
            .rules(hasLaterRule ? [firstRule, laterRule] : [firstRule])
            .fallthrough({
              dispatchKey: 'keyId',
              includedInExpt: false,
              variations: [{ id: 'default', rollout: [0, 1], exptRollout: 1 }],
            }).build();
          const data = deserializeAll([flag], segments);
          store.init({
            [DataKinds.Flags.namespace]: data.flags,
            [DataKinds.Segments.namespace]: data.segments,
          }, () => {});

          const [result] = evaluator.evaluate('flag', context);
          expect(result.kind).toBe(hasLaterRule ? ReasonKinds.RuleMatch : ReasonKinds.FallThrough);
          expect(result.value).toBe(hasLaterRule ? 'later-match' : 'default-rule');
        }
      });
  });
});

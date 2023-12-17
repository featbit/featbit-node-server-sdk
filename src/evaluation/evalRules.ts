import { ITargetRule } from "./data/Rule";
import { ICondition } from "./data/Condition";
import { ISegment } from "./data/Segment";
import Context from "../Context";
import { Operator } from "./operator";
import { IStore } from "../store/Store";
import VersionedDataKinds from "../store/VersionedDataKinds";

const IsInSegmentProperty = "User is in segment";
const IsNotInSegmentProperty = "User is not in segment";

function isMatchCondition(condition: ICondition, context: Context) {
  const value = context.value(condition.property);

  const operator = Operator.get(condition.op);
  return operator.isMatch(value, condition.value);
}

function isMatchSegment(segment: ISegment, context: Context) {
  if(segment.excluded.includes(context.key)) {
    return false;
  }

  if(segment.included.includes(context.key)) {
    return true;
  }

  // if any rule match this user
  return segment.rules.some(rule => rule.conditions.every(c => isMatchCondition(c, context)));
}

function isMatchAnySegment(store: IStore, condition: ICondition, context: Context) {
  const segmentIds: string[] = JSON.parse(condition.value);
  if(segmentIds == null || !segmentIds.length) {
    return false;
  }

  for(const segmentId of segmentIds) {
    const segment = store.get(VersionedDataKinds.Segments, segmentId) as ISegment;
    if(segment && isMatchSegment(segment, context)) {
      return true;
    }
  }

  return false;
}

export function isMatchRule(store: IStore, rule: ITargetRule, context: Context) : boolean {
  for(const condition of rule.conditions) {
    if(condition.property === IsInSegmentProperty) {
      const match = isMatchAnySegment(store, condition, context);
      if (!match) {
        return false;
      }
    } else if(condition.property === IsNotInSegmentProperty) {
      const match = isMatchAnySegment(store, condition, context);
      if (match) {
        return false;
      }
    } else if (!isMatchCondition(condition, context)) {
      return false
    }
  }

  return true;
}

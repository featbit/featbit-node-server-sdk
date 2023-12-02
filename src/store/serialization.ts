import { IFlag } from "../evaluation/data/Flag";
import { ISegment } from "../evaluation/data/Segment";
import { IRollout } from "../evaluation/data/Rollout";
import VersionedDataKinds, { IVersionedDataKind } from "./VersionedDataKinds";
import { IVersionedData } from "../interfaces/VersionedData";

/**
 * @internal
 */
export function reviver(this: any, key: string, value: any): any {
    // Whenever a null is included we want to remove the field.
    // In this way validation checks do not have to consider null, only undefined.
    if (value === null) {
        return undefined;
    }

    return value;
}

export interface FlagsAndSegments {
    flags: { [name: string]: IFlag };
    segments: { [name: string]: ISegment };
}

export interface IAllData {
    data: FlagsAndSegments;
}

export interface IDeleteData extends Omit<IVersionedData, 'key'> {
    path: string;
    kind?: IVersionedDataKind;
}

export interface IPatchData {
    path: string;
    data: IFlag | ISegment;
    kind?: IVersionedDataKind;
}

function processRollout(rollout?: IRollout) {
    // TODO
}

/**
 * @internal
 */
export function processFlag(flag: IFlag) {
    // TODO
    // if (flag.fallthrough && flag.fallthrough.rollout) {
    //     const rollout = flag.fallthrough.rollout!;
    //     processRollout(rollout);
    // }
    // flag?.rules?.forEach((rule) => {
    //     processRollout(rule.rollout);
    //
    //     rule?.clauses?.forEach((clause) => {
    //         if (clause && clause.attribute) {
    //             // Clauses before U2C would have had literals for attributes.
    //             // So use the contextKind to indicate if this is new or old data.
    //             clause.attributeReference = new AttributeReference(clause.attribute, !clause.contextKind);
    //         } else if (clause) {
    //             clause.attributeReference = AttributeReference.invalidReference;
    //         }
    //     });
    // });
}

/**
 * @internal
 */
export function processSegment(segment: ISegment) {
    // TODO
    // if (segment?.included?.length && segment.included.length > TARGET_LIST_ARRAY_CUTOFF) {
    //     segment.generated_includedSet = new Set(segment.included);
    //     delete segment.included;
    // }
    // if (segment?.excluded?.length && segment.excluded.length > TARGET_LIST_ARRAY_CUTOFF) {
    //     segment.generated_excludedSet = new Set(segment.excluded);
    //     delete segment.excluded;
    // }
    //
    // if (segment?.includedContexts?.length) {
    //     segment.includedContexts.forEach((target) => {
    //         if (target?.values?.length && target.values.length > TARGET_LIST_ARRAY_CUTOFF) {
    //             target.generated_valuesSet = new Set(target.values);
    //             // Currently typing is non-optional, so we don't delete it.
    //             target.values = [];
    //         }
    //     });
    // }
    //
    // if (segment?.excludedContexts?.length) {
    //     segment.excludedContexts.forEach((target) => {
    //         if (target?.values?.length && target.values.length > TARGET_LIST_ARRAY_CUTOFF) {
    //             target.generated_valuesSet = new Set(target.values);
    //             // Currently typing is non-optional, so we don't delete it.
    //             target.values = [];
    //         }
    //     });
    // }
    //
    // segment?.rules?.forEach((rule) => {
    //     if (rule.bucketBy) {
    //         // Rules before U2C would have had literals for attributes.
    //         // So use the rolloutContextKind to indicate if this is new or old data.
    //         rule.bucketByAttributeReference = new AttributeReference(
    //             rule.bucketBy,
    //             !rule.rolloutContextKind,
    //         );
    //     }
    //     rule?.clauses?.forEach((clause) => {
    //         if (clause && clause.attribute) {
    //             // Clauses before U2C would have had literals for attributes.
    //             // So use the contextKind to indicate if this is new or old data.
    //             clause.attributeReference = new AttributeReference(clause.attribute, !clause.contextKind);
    //         } else if (clause) {
    //             clause.attributeReference = AttributeReference.invalidReference;
    //         }
    //     });
    // });
}

function tryParse(data: string): any {
    try {
        return JSON.parse(data, reviver);
    } catch {
        return undefined;
    }
}

/**
 * @internal
 */
export function deserializeAll(data: string): IAllData | undefined {
    // The reviver lacks the context of where a different key exists, being as it
    // starts at the deepest level and works outward. As a result attributes are
    // translated into references after the initial parsing. That way we can be sure
    // they are the correct ones. For instance if we added 'attribute' as a new field to
    // the schema for something that was NOT an attribute reference, then we wouldn't
    // want to construct an attribute reference out of it.
    const parsed = tryParse(data) as IAllData;

    if (!parsed) {
        return undefined;
    }

    Object.values(parsed?.data?.flags || []).forEach((flag) => {
        processFlag(flag);
    });

    Object.values(parsed?.data?.segments || []).forEach((segment) => {
        processSegment(segment);
    });
    return parsed;
}


/**
 * This function is intended for usage inside FeatBit SDKs.
 * This function should NOT be used by customer applications.
 * This function may be changed or removed without a major version.
 *
 * @param data String data from FeatBit.
 * @returns The parsed and processed data.
 */
export function deserializePoll(data: string): FlagsAndSegments | undefined {
    const parsed = tryParse(data) as FlagsAndSegments;

    if (!parsed) {
        return undefined;
    }

    Object.values(parsed?.flags || []).forEach((flag) => {
        processFlag(flag);
    });

    Object.values(parsed?.segments || []).forEach((segment) => {
        processSegment(segment);
    });
    return parsed;
}

/**
 * @internal
 */
export function deserializePatch(data: string): IPatchData | undefined {
    const parsed = tryParse(data) as IPatchData;

    if (!parsed) {
        return undefined;
    }

    if (parsed.path.startsWith(VersionedDataKinds.Features.streamApiPath)) {
        processFlag(parsed.data as IFlag);
        parsed.kind = VersionedDataKinds.Features;
    } else if (parsed.path.startsWith(VersionedDataKinds.Segments.streamApiPath)) {
        processSegment(parsed.data as ISegment);
        parsed.kind = VersionedDataKinds.Segments;
    }

    return parsed;
}

/**
 * @internal
 */
export function deserializeDelete(data: string): IDeleteData | undefined {
    const parsed = tryParse(data) as IDeleteData;
    if (!parsed) {
        return undefined;
    }
    if (parsed.path.startsWith(VersionedDataKinds.Features.streamApiPath)) {
        parsed.kind = VersionedDataKinds.Features;
    } else if (parsed.path.startsWith(VersionedDataKinds.Segments.streamApiPath)) {
        parsed.kind = VersionedDataKinds.Segments;
    }
    return parsed;
}

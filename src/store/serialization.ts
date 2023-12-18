import { IFlag } from "../evaluation/data/IFlag";
import { ISegment } from "../evaluation/data/ISegment";
import VersionedDataKinds, { IVersionedDataKind } from "./VersionedDataKinds";
import { IVersionedData } from "../interfaces/IVersionedData";
import { getTimestampFromDateTimeString } from "../streaming/utils";

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

type VersionedFlag = IVersionedData & IFlag;
type VersionedSegment = IVersionedData & ISegment;

export interface IPatchData {
    data: VersionedFlag | VersionedSegment;
    kind: IVersionedDataKind;
}

/**
 * @internal
 */
export function deserializeAll(flags: IFlag[], segments: ISegment[]): FlagsAndSegments {
    const result = {
        [VersionedDataKinds.Flags.namespace]: {},
        [VersionedDataKinds.Segments.namespace]: {}
    };

    if(flags?.length) {
        result[VersionedDataKinds.Flags.namespace] = flags.reduce((acc: any, cur: any) => {
            acc[cur.key] = {...cur, version: getTimestampFromDateTimeString(cur.updatedAt)};
            return acc;
        }, {});
    }

    if(segments?.length) {
        result[VersionedDataKinds.Segments.namespace] = segments.reduce((acc: any, cur: any) => {
            acc[cur.id] = {...cur, key: cur.id, version: getTimestampFromDateTimeString(cur.updatedAt)};
            return acc;
        }, {});
    }

    return result as any as FlagsAndSegments;
}

/**
 * @internal
 */
export function deserializePatch(flags: IFlag[], segments: ISegment[]): IPatchData[] {
    const result = [
      ...flags?.map(item => ({
          data: {
              ...item,
              version: getTimestampFromDateTimeString(item.updatedAt),
          },
          kind: VersionedDataKinds.Flags
      })) || [],
      ...segments?.map(item => ({
          data: {
              ...item,
              version: getTimestampFromDateTimeString(item.updatedAt),
              key: item.id
          },
          kind: VersionedDataKinds.Segments
      })) || []
    ];

    return result as any as IPatchData[];
}

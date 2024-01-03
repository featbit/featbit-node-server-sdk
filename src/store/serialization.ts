import { IFlag } from "../evaluation/data/IFlag";
import { ISegment } from "../evaluation/data/ISegment";
import DataKinds from "./DataKinds";
import { IVersionedData } from "../IVersionedData";
import { getTimestampFromDateTimeString } from "../data-sync/utils";
import { IDataKind } from "../IDataKind";

export interface FlagsAndSegments {
  flags: { [name: string]: IFlag };
  segments: { [name: string]: ISegment };
}

type VersionedFlag = IVersionedData & IFlag;
type VersionedSegment = IVersionedData & ISegment;

export interface IPatchData {
  data: VersionedFlag | VersionedSegment;
  kind: IDataKind;
}

/**
 * @internal
 */
export function deserializeAll(flags: IFlag[], segments: ISegment[]): FlagsAndSegments {
  const result = {
    [DataKinds.Flags.namespace]: {},
    [DataKinds.Segments.namespace]: {}
  };

  if (flags?.length) {
    result[DataKinds.Flags.namespace] = flags.reduce((acc: any, cur: any) => {
      acc[cur.key] = {...cur, version: getTimestampFromDateTimeString(cur.updatedAt)};
      return acc;
    }, {});
  }

  if (segments?.length) {
    result[DataKinds.Segments.namespace] = segments.reduce((acc: any, cur: any) => {
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
      kind: DataKinds.Flags
    })) || [],
    ...segments?.map(item => ({
      data: {
        ...item,
        version: getTimestampFromDateTimeString(item.updatedAt),
        key: item.id
      },
      kind: DataKinds.Segments
    })) || []
  ];

  return result as any as IPatchData[];
}

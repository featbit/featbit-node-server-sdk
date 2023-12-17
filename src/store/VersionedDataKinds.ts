import { IDataKind } from "../interfaces/DataKind";

export interface IVersionedDataKind extends IDataKind {
    namespace: string;
}

export default class VersionedDataKinds {
    static readonly Flags: IVersionedDataKind = {
        namespace: 'flags'
    };

    static readonly Segments: IVersionedDataKind = {
        namespace: 'segments'
    };
}
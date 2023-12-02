import {IDataKind} from "../interfaces/DataKind";

export interface IVersionedDataKind extends IDataKind {
    namespace: string;
    streamApiPath: string;
    getDependencyKeys?: (item: any) => string[];
}

export default class VersionedDataKinds {
    static readonly Features: IVersionedDataKind = {
        namespace: 'features',
        streamApiPath: '/flags/',
    };

    static readonly Segments: IVersionedDataKind = {
        namespace: 'segments',
        streamApiPath: '/segments/',
    };

    static getKeyFromPath(kind: IVersionedDataKind, path: string): string | undefined {
        return path.startsWith(kind.streamApiPath)
            ? path.substring(kind.streamApiPath.length)
            : undefined;
    }
}
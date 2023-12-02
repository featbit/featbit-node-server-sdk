import { IDataKind } from "./DataKind";

export interface ICache {
    get(kind: IDataKind, key: string): Promise<string | null>;
}
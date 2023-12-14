import { IContextProperty } from "./ContextProperty";

export interface IUser {
    name: string;
    keyId: string;
    customizedProperties: IContextProperty[];
}
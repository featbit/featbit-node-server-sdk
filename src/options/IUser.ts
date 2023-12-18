import { IContextProperty } from "../interfaces/ContextProperty";

export interface IUser {
    name: string;
    keyId: string;
    customizedProperties: IContextProperty[];
}
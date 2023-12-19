import { IContextProperty } from "../IContextProperty";

export interface IUser {
  name: string;
  keyId: string;
  customizedProperties: IContextProperty[];
}
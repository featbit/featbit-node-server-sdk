import { IContextProperty } from "../IContextProperty";

export interface IUser {
  key: string;
  name?: string;
  customizedProperties?: IContextProperty[];
}
import { ContextKind } from "../constants";
import { IContextProperty } from "./ContextProperty";

export interface IContext {
    kind: ContextKind;
    name: string;
    key: string;
    customizedProperties: IContextProperty[];
}
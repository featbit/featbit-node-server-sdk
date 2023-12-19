import { IDataKind } from "../IDataKind";

export default class DataKinds {
  static readonly Flags: IDataKind = {
    namespace: 'flags'
  };

  static readonly Segments: IDataKind = {
    namespace: 'segments'
  };
}
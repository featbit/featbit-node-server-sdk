import { PollingError, StreamingError } from "../errors";
import { IFlag } from "../evaluation/data/Flag";
import { ISegment } from "../evaluation/data/Segment";

export type StreamingErrorHandler = (err: StreamingError) => void;

export type PollingErrorHandler = (err: PollingError) => void;

export enum StreamResponseEventType {
  full = 'full',
  patch = 'patch'
}

export interface IStreamResponse {
  eventType: StreamResponseEventType,
  featureFlags: IFlag[]
  segments: ISegment[]
}
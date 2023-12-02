import { PollingError, StreamingError } from "../errors";

export type StreamingErrorHandler = (err: StreamingError) => void;

export type PollingErrorHandler = (err: PollingError) => void;
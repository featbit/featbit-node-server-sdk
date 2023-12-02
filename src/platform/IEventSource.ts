export type EventName = 'delete' | 'patch' | 'ping' | 'put';
export type EventListener = (event?: { data?: any }) => void;
export type ProcessStreamResponse = {
    deserializeData: (data: string) => any;
    processJson: (json: any) => void;
};

export interface IEventSource {
    onclose: (() => void) | undefined;
    onerror: (() => void) | undefined;
    onopen: (() => void) | undefined;
    onretrying: ((e: { delayMillis: number }) => void) | undefined;

    addEventListener(type: EventName, listener: EventListener): void;
    close(): void;
}

export interface IEventSourceInitDict {
    errorFilter: (err: { status: number; message: string }) => boolean;
    initialRetryDelayMillis: number;
    readTimeoutMillis: number;
    retryResetIntervalMillis: number;
}
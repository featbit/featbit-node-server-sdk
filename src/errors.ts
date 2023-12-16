export class PollingError extends Error {
    public readonly status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.status = status;
        this.name = 'FeatBitPollingError';
    }
}

export class StreamingError extends Error {
    public readonly code?: number;

    constructor(message: string, code?: number) {
        super(message);
        this.code = code;
        this.name = 'FeatBitStreamingError';
    }
}

export class UnexpectedResponseError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FeatBitUnexpectedResponseError';
    }
}


export class ClientError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FeatBitClientError';
    }
}

export function isHttpRecoverable(status: number) {
    if (status >= 400 && status < 500) {
        return status === 400 || status === 408 || status === 429;
    }
    return true;
}
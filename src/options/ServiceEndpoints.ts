// This function is designed to remove any trailing forward slashes at the end of the provided URI string
function canonicalizeUri(uri: string): string {
    return uri.replace(/\/+$/, '');
}

/**
 * Specifies the base service URIs used by SDK components.
 */
export default class ServiceEndpoints {
    public readonly streaming: string;
    public readonly polling: string;
    public readonly events: string;

    public constructor(
        baseUri: string
    ) {
        const canonicalizedUri = canonicalizeUri(baseUri);

        this.streaming = `${canonicalizedUri}/streaming`;
        this.polling = `${canonicalizedUri}/api/public/sdk/server/latest-all`;
        this.events = `${canonicalizedUri}/api/public/insight/track`;
    }
}

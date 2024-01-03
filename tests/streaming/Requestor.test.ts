import Requestor from "../../src/data-sync/Requestor";
import { IHeaders, IRequestOptions, IRequests, IResponse } from "../../src/platform/requests";
import Configuration from "../../src/Configuration";
import NodeInfo from "../../src/platform/node/NodeInfo";

describe('given a requestor', () => {
  let requestor: Requestor;

  let requestsMade: Array<{ url: string; options: IRequestOptions }>;

  let testHeaders: Record<string, string>;
  let testStatus = 200;
  let testResponse: string | undefined;
  let throwThis: string | undefined;

  function resetRequestState() {
    requestsMade = [];
    testHeaders = {};
    testStatus = 200;
    testResponse = undefined;
    throwThis = undefined;
  }

  beforeEach(() => {
    resetRequestState();

    const requests: IRequests = {
      async fetch(url: string, options?: IRequestOptions): Promise<IResponse> {
        return new Promise<IResponse>((a, r) => {
          if (throwThis) {
            r(new Error(throwThis));
          }
          const headers: IHeaders = {
            get(name: string): string | null {
              return testHeaders[name] || null;
            },
            keys(): Iterable<string> {
              throw new Error('Function not implemented.');
            },
            values(): Iterable<string> {
              throw new Error('Function not implemented.');
            },
            entries(): Iterable<[string, string]> {
              throw new Error('Function not implemented.');
            },
            has(_name: string): boolean {
              throw new Error('Function not implemented.');
            },
          };

          const res: IResponse = {
            headers,
            status: testStatus,
            async text(): Promise<string> {
              return testResponse ?? '';
            },
            json(): Promise<any> {
              throw new Error('Function not implemented.');
            },
          };
          requestsMade.push({url, options: options!});
          a(res);
        });
      },
    };

    requestor = new Requestor('sdkKey', new Configuration({pollingUri: 'http://localhost:5100'}), new NodeInfo(), requests);
  });

  it('gets data', (done) => {
    testResponse = 'a response';
    requestor.requestData(0, (err, body) => {
      expect(err).toBeUndefined();
      expect(body).toEqual(testResponse);

      expect(requestsMade.length).toBe(1);
      expect(requestsMade[0].url).toBe('http://localhost:5100/api/public/sdk/server/latest-all?timestamp=0');
      expect(requestsMade[0].options.headers?.authorization).toBe('sdkKey');
      expect(requestsMade[0].options.headers?.['user-agent']).toBe('NodeJS-Server-SDK/1.0.0');
      done();
    });
  });

  it('returns an error result for an http error', (done) => {
    testStatus = 401;
    requestor.requestData(0, (err, _body) => {
      expect(err).toBeDefined();
      done();
    });
  });

  it('returns an error result for a network error', (done) => {
    throwThis = 'SOMETHING BAD';
    requestor.requestData(0, (err, _body) => {
      expect(err.message).toBe(throwThis);
      done();
    });
  });

  it('stores and sends etags', async () => {
    testHeaders.etag = 'abc123';
    testResponse = 'a response';
    const res1 = await new Promise<{ err: any; body: any }>((cb) => {
      requestor.requestData(0, (err, body) => cb({err, body}));
    });
    testStatus = 304;
    const res2 = await new Promise<{ err: any; body: any }>((cb) => {
      requestor.requestData(0, (err, body) => cb({err, body}));
    });
    expect(res1.err).toBeUndefined();
    expect(res1.body).toEqual(testResponse);
    expect(res2.err).toBeUndefined();
    expect(res2.body).toEqual(null);

    const req1 = requestsMade[0];
    const req2 = requestsMade[1];
    expect(req1.options.headers?.['if-none-match']).toBe(undefined);
    expect(req2.options.headers?.['if-none-match']).toBe((testHeaders.etag = 'abc123'));
  });
});

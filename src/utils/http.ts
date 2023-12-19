import { IInfo } from "../platform/IInfo";

export type Headers = {
  authorization: string;
  'user-agent': string;
};

export function defaultHeaders(
  sdkKey: string,
  info: IInfo
): Headers {
  const {userAgentBase, version} = info.sdkData();

  const headers: Headers = {
    'user-agent': `${ userAgentBase ?? info.appType }/${ version }`,
    'authorization': sdkKey
  };

  return headers;
}

export function httpErrorMessage(
  err: {
    status: number;
    message: string;
  },
  context: string,
  retryMessage?: string,
): string {
  let desc;
  if (err.status) {
    desc = `error ${ err.status }${ err.status === 401 ? ' (invalid SDK key)' : '' }`;
  } else {
    desc = `I/O error (${ err.message || err })`;
  }
  const action = retryMessage ?? 'giving up permanently';
  return `Received ${ desc } for ${ context } - ${ action }`;
}

import { IInfo, IPlatformData, ISdkData } from "../IInfo";
import * as os from "os";
import { version, name } from '../../../package.json';

function processPlatformName(name: string): string {
  switch (name) {
    case 'darwin':
      return 'MacOS';
    case 'win32':
      return 'Windows';
    case 'linux':
      return 'Linux';
    default:
      return name;
  }
}

export default class NodeInfo implements IInfo {
  get appType(): string {
    return 'NodeJS-Server-SDK';
  }

  platformData(): IPlatformData {
    return {
      os: {
        name: processPlatformName(os.platform()),
        version: os.version(),
        arch: os.arch(),
      },
      name: 'Node',
      additional: {
        nodeVersion: process.versions.node,
      },
    };
  }

  sdkData(): ISdkData {
    return {
      name: name,
      version: version,
      userAgentBase: this.appType
    };
  }
}

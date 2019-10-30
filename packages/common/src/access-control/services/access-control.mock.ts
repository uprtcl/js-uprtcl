import { AccessControlService } from './access-control.service';

export class AccessControlMock implements AccessControlService {
  canRead(hash: string): Promise<boolean> {
    return Promise.resolve(true);
  }

  canWrite(hash: string): Promise<boolean> {
    return Promise.resolve(true);
  }
  getAccessControlInformation(hash: string): Promise<object | undefined> {
    return Promise.resolve(undefined);
  }
}

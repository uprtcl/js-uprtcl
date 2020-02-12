import ipfsClient, { Buffer } from 'ipfs-http-client';

import { ConnectionOptions, Connection } from '@uprtcl/multiplatform';

export interface IpfsConnectionOptions {
  host: string;
  port: number;
  protocol: string;
  headers?: { [key: string]: string };
}

export class IpfsConnection extends Connection {
  client: any;

  constructor(
    protected ipfsOptions: IpfsConnectionOptions,
    connectionOptions: ConnectionOptions = {}
  ) {
    super(connectionOptions);
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    this.client = ipfsClient(this.ipfsOptions);
  }

  public tryPut(buffer: Buffer, putConfig: object, wait: number, attempt: number): Promise<any> {
    return new Promise((resolve, reject) => {
      this.logger.log(`Try put. Attempt: ${attempt}`, { client: this.client, buffer, putConfig });

      let timeout;
      if (attempt < 4) {
        /** retry recursively with twice as much the wait time setting */
        timeout = setTimeout(() => {
          this.tryPut(buffer, putConfig, wait * 2, attempt + 1)
            .then((result: any) => resolve(result))
            .catch(e => reject(e));
        }, wait);
      }

      this.client.dag.put(buffer, putConfig).then((result: object) => {
        clearTimeout(timeout);
        resolve(result);
      });
    });
  }

  public tryGet(hash: string, wait: number, attempt: number): Promise<any> {
    let timeout;

    return new Promise((resolve, reject) => {
      this.logger.log(`Trying to get ${hash}. Attempt: ${attempt}`);

      let found = false;

      /** retry recursively with twice as much the wait time setting */
      if (attempt < 1) {
        timeout = setTimeout(() => {
          this.tryGet(hash, wait * 2, attempt + 1)
            .then(result => resolve(result))
            .catch(e => {
              if (!found) reject(e);
            });
        }, wait);
      }

      this.client.dag.get(hash).then((result: any) => {
        found = true;
        clearTimeout(timeout);
        resolve(result);
      });
    });
  }
}

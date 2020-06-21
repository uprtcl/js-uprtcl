import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { OrbitDB, OrbitDBAddress, OrbitDBStore } from 'orbit-db';
import { Perspective } from '../../../types';

export interface OrbitDBConnectionOptions {
  directory?: string;
  peerId?: string;
  keystore?: any;
  cache?: any;
  identity?: any;
  offline?: boolean;
}

export class OrbitDBConnection extends Connection {
  public instance: any;
  private storeQueue = {};

  constructor(
    protected ipfsClient: any,
    protected orbitdbOptions?: OrbitDBConnectionOptions,
    options?: ConnectionOptions
  ) {
    super(options);
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    this.instance = await OrbitDB.createInstance(
      this.ipfsClient,
      this.orbitdbOptions
    );
  }

  public async perspectiveAddress(
    perspective: Perspective
  ): Promise<OrbitDBAddress> {
    return this.instance.determineAddress(
      `perspective-store/${perspective.path}`,
      'log',
      {
        accessController: { type: 'ipfs', write: [perspective.creatorId] },
        meta: { timestamp: perspective.timestamp },
      }
    );
  }

  public async contextAddress(context: string): Promise<OrbitDBAddress> {
    return this.instance.determineAddress(`context-store/${context}`, 'feed', {
      accessController: { type: 'ipfs', write: ['*'] },
    });
  }

  private openStore(address: string | OrbitDBAddress): Promise<OrbitDBStore> {
    if (this.instance.stores[address]) return this.instance.stores[address];
    if (this.storeQueue[address]) return this.storeQueue[address];

    return (this.storeQueue[address] = this.instance
      .open(address)
      .finally(() => delete this.storeQueue[address]));
  }

  public async perspectiveStore(
    perspective: Perspective
  ): Promise<OrbitDBStore> {
    const address = await this.perspectiveAddress(perspective);
    return this.openStore(address);
  }

  public async contextStore(context: string): Promise<OrbitDBStore> {
    const address = await this.contextAddress(context);
    return this.openStore(address);
  }
}

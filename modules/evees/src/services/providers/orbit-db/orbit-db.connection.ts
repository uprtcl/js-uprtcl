import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Perspective } from 'src/types';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import OrbitDB from 'orbit-db';
import OrbitDBSet from '@tabcat/orbit-db-set';
import attachIpfsStore from './context-access-controller'
OrbitDB.addDatabaseType(OrbitDBSet.type, OrbitDBSet);


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
    protected ipfsStore: IpfsStore,
    protected orbitdbOptions?: OrbitDBConnectionOptions,
    options?: ConnectionOptions
  ) {
    super(options);
    const AccessController = attachIpfsStore(this.ipfsStore);
    OrbitDB.AccessControllers.addAccessController({ AccessController });

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

  public async contextAddress(
    context: string
  ): Promise<any> {
    return this.instance.determineAddress(`context-store/${context}`, 'set', {
      accessController: { type: 'context', write: ['*'] },
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

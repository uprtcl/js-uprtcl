import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Perspective } from 'src/types';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import OrbitDB from 'orbit-db';
import OrbitDBSet from '@tabcat/orbit-db-set';
import { attachIpfsStore } from './context-access-controller';
import {
  IdentityProvider,
  Keystore,
} from '@tabcat/orbit-db-identity-provider-d';
OrbitDB.addDatabaseType(OrbitDBSet.type, OrbitDBSet);
OrbitDB.Identities.addIdentityProvider(IdentityProvider);

const keystorePath = (id) => `./orbitdb/identity/odbipd-${id}`;

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
  private identity: null | any = null;

  constructor(protected ipfsStore: IpfsStore, options?: ConnectionOptions) {
    super(options);
    const AccessController = attachIpfsStore(this.ipfsStore);
    if (!OrbitDB.AccessControllers.isSupported(AccessController.type)) {
      OrbitDB.AccessControllers.addAccessController({ AccessController });
    }
  }

  /**
   * @override
   */
  protected async connect(): Promise<void> {
    this.instance = await OrbitDB.createInstance(this.ipfsStore.client);
    this.identity = this.instance.identity;
  }

  // public async disconnect(): Promise<void> {
  //   await this.identity.provider.keystore.close()
  //   await this.instance.stop()
  //   this.instance = null
  // }

  public async deriveIdentity(sig: string): Promise<any> {
    const id = sig.slice(-8);
    return OrbitDB.Identities.createIdentity({
      keystore: new Keystore(keystorePath(id)),
      type: IdentityProvider.type,
      id: id,
      derive: sig,
    });
  }

  public useIdentity(identity: any): void {
    this.identity = identity;
  }

  public async perspectiveAddress(perspective: Perspective): Promise<any> {
    return this.instance.determineAddress('perspective-store', 'log', {
      accessController: { type: 'ipfs', write: [perspective.creatorId] },
      meta: { timestamp: perspective.timestamp },
    });
  }

  public async contextAddress(context: string): Promise<any> {
    return this.instance.determineAddress(`context-store/${context}`, 'set', {
      accessController: { type: 'context', write: ['*'] },
    });
  }

  private async openStore(address: string | any): Promise<any> {
    let db;

    if (this.instance.stores[address]) db = this.instance.stores[address];
    else if (this.storeQueue[address]) db = this.storeQueue[address];
    else
      db = this.storeQueue[address] = this.instance
        .open(address, { identity: this.identity })
        .finally(() => delete this.storeQueue[address]);

    db = await db;

    if (db.identity.id !== this.identity.id) db.identity = this.identity;
    return db;
  }

  public async perspectiveStore(perspective: Perspective): Promise<any> {
    const address = await this.perspectiveAddress(perspective);
    return this.openStore(address);
  }

  public async contextStore(context: string): Promise<any> {
    const address = await this.contextAddress(context);
    return this.openStore(address);
  }
}

import OrbitDB from 'orbit-db';
import OrbitDBSet from '@tabcat/orbit-db-set';
import IPFS from 'ipfs';

import { Logger } from '@uprtcl/micro-orchestrator';
import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Perspective } from '@uprtcl/evees';

import { IdentityProvider, Keystore } from '@tabcat/orbit-db-identity-provider-d';
import { contextsAccesssControl } from './context-access-controller';

OrbitDB.addDatabaseType(OrbitDBSet.type, OrbitDBSet);
OrbitDB.Identities.addIdentityProvider(IdentityProvider);

const keystorePath = id => `./orbitdb/identity/odbipd-${id}`;

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
  public identity: null | any = null;

  logger = new Logger('OrbitDB-Connection');

  constructor(
    protected pinnerUrl: string,
    protected ipfsStore: any,
    protected ipfs?: any,
    options?: ConnectionOptions
  ) {
    super(options);
    const AccessController = contextsAccesssControl(this.ipfsStore);
    if (!OrbitDB.AccessControllers.isSupported(AccessController.type)) {
      OrbitDB.AccessControllers.addAccessController({ AccessController });
    }
  }

  /**
   * @override
   */
  public async connect(params: any): Promise<void> {
    this.logger.log('Connecting');
    if (!this.ipfs) {
      this.ipfs = await IPFS.create(params);
    }
    this.instance = await OrbitDB.createInstance(this.ipfs);
    this.identity = this.instance.identity;
    this.logger.log('Connected', {
      instance: this.instance,
      identity: this.identity
    });
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
      derive: sig
    });
  }

  public useIdentity(identity: any): void {
    this.identity = identity;
  }

  public async perspectiveAddress(perspective: Perspective): Promise<any> {
    return this.instance.determineAddress('perspective-store', 'eventlog', {
      accessController: { type: 'ipfs', write: [perspective.creatorId] },
      meta: { timestamp: perspective.timestamp }
    });
  }

  public async contextAddress(context: string): Promise<any> {
    return this.instance.determineAddress(`context-store/${context}`, 'set', {
      accessController: { type: 'context', write: ['*'] }
    });
  }

  private async openStore(address: string | any): Promise<any> {
    this.logger.log('Openning store', { address });
    let db;

    if (this.instance.stores[address]) db = this.instance.stores[address];
    else if (this.storeQueue[address]) db = this.storeQueue[address];
    else
      db = this.storeQueue[address] = this.instance
        .open(address, { identity: this.identity })
        .then(async store => {
          await store.load();
          return store;
        })
        .finally(() => delete this.storeQueue[address]);
    db = await db;

    if (db.identity.id !== this.identity.id) db.setIdentity(this.identity);
    this.logger.log('store opened', { db });
    return db;
  }

  public async perspectiveStore(perspective: Perspective, pin: boolean): Promise<any> {
    const address = await this.perspectiveAddress(perspective);
    const store = this.openStore(address);
    if (pin) {
      this.pin(address);
    }
    return store;
  }

  public async contextStore(context: string, pin: boolean = false): Promise<any> {
    const address = await this.contextAddress(context);
    const store = await this.openStore(address);
    if (pin) {
      this.pin(address);
    }
    return store;
  }

  public async pin(address: string) {
    fetch(`${this.pinnerUrl}/pin?address=${address}`, {
      method: 'GET'
    }).then(response => {
      console.log(response);
    });
  }
}

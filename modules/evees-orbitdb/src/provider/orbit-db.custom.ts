import OrbitDB from 'orbit-db';
import IPFS from 'ipfs';

import OrbitDBSet from '@tabcat/orbit-db-set';
import { IdentityProvider, Keystore } from '@tabcat/orbit-db-identity-provider-d';

import { Logger } from '@uprtcl/micro-orchestrator';
import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';

import { EntropyGenerator } from '../identity-providers/entropy.generator';

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

export interface CustomStore {
  type: string;
  recognize: (entity: any) => boolean;
  name: (entity: any) => any;
  options: (entity: any) => any;
}

export interface CustomStores {
  [name: string]: CustomStore;
}

export class OrbitDBCustom extends Connection {
  public instance: any;
  private storeQueue = {};
  public identity: null | any = null;
  loggedIn: boolean = false;

  logger = new Logger('OrbitDB-Connection');

  constructor(
    protected storeManifests: CustomStores,
    protected acls: any[],
    protected entropy: EntropyGenerator,
    protected pinnerUrl?: string,
    protected ipfs?: any,
    options?: ConnectionOptions
  ) {
    super(options);

    /** register AccessControllers */
    this.acls.map(AccessController => {
      if (!OrbitDB.AccessControllers.isSupported(AccessController.type)) {
        OrbitDB.AccessControllers.addAccessController({ AccessController });
      }
    });
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

  public async login() {
    const privateKey = await this.entropy.get();
    const identity = await this.deriveIdentity(privateKey);
    this.useIdentity(identity);
    this.loggedIn = true;
  }

  public async logout() {
    this.useIdentity(this.instance.identity);
    this.loggedIn = false;
  }

  public isLogged() {
    return this.loggedIn;
  }

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

  private storeManifestName(entity: any): string | undefined {
    const entry = Object.entries(this.storeManifests).find(entry => {
      return entry[1].recognize(entity);
    });
    return entry ? entry[0] : undefined;
  }

  public async storeAddress(entity: any): Promise<string> {
    const storeName = this.storeManifestName(entity);
    if (storeName === undefined)
      throw new Error(`store for entity ${JSON.stringify(entity)} not found`);
    const storeManifest = this.storeManifests[storeName];

    return this.instance.determineAddress(
      storeManifest.name,
      storeManifest.type,
      storeManifest.options(entity)
    );
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

  public async getStore(entity: any, pin: boolean = false): Promise<any> {
    const address = await this.storeAddress(entity);
    const store = this.openStore(address);
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

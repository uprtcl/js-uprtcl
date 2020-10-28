import OrbitDB from 'orbit-db';
import IPFS from 'ipfs';

import OrbitDBSet from '@tabcat/orbit-db-set';
import { IdentityProvider, Keystore } from '@tabcat/orbit-db-identity-provider-d';

import { Logger } from '@uprtcl/micro-orchestrator';
import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { PinnedCacheDB } from '@uprtcl/ipfs-provider';

import { IdentitySource } from './identity.source';
import { CustomStore } from './types';
import { EveesOrbitDBRootEntities } from './custom.stores';

OrbitDB.addDatabaseType(OrbitDBSet.type, OrbitDBSet);
OrbitDB.Identities.addIdentityProvider(IdentityProvider);

const keystorePath = id => `./orbitdb/identity/odbipd-${id}`;

export const loginMsg = `
Please Read!

I authorize this app to update my _Prtcl content in OrbitDB.
`;

export const mappingMsg = (identity: string) =>
  `I confirm to be the owner of OrbitDB identity:${identity}`;

interface Status {
  pinnerHttpConnected: boolean;
  pinnerPeerConnected: boolean;
  logged: boolean;
}

export class OrbitDBCustom extends Connection {
  public instance: any;
  pinnedCache: PinnedCacheDB;
  private storeQueue = {};
  public identity: null | any = null;
  readonly status: Status = {
    pinnerHttpConnected: false,
    pinnerPeerConnected: false,
    logged: false
  };

  logger = new Logger('OrbitDB-Connection');

  constructor(
    protected storeManifests: CustomStore[],
    protected acls: any[],
    protected identitySource: IdentitySource,
    protected pinnerUrl?: string,
    protected pinnerMultiaddr?: string,
    public ipfs?: any,
    options?: ConnectionOptions
  ) {
    super(options);

    /** register AccessControllers */
    this.acls.map(AccessController => {
      if (!OrbitDB.AccessControllers.isSupported(AccessController.type)) {
        OrbitDB.AccessControllers.addAccessController({ AccessController });
      }
    });

    this.pinnedCache = new PinnedCacheDB(`pinned-at-${this.pinnerUrl}`);
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

    // TODO: set status when peer connected is pinner address

    this.logger.log('Connected', {
      instance: this.instance,
      identity: this.identity
    });
  }

  public async login() {
    const privateKey = await this.identitySource.signText(loginMsg);
    const identity = await this.deriveIdentity(privateKey);
    this.useIdentity(identity);

    const mappingStore = await this.getStore(
      EveesOrbitDBRootEntities.AddressMapping,
      {
        sourceId: this.identitySource.sourceId,
        key: identity.id
      },
      true
    );

    const [signedAccountEntry] = mappingStore.iterator({ limit: 1 }).collect();
    this.logger.log(
      `Address mapping on store ${mappingStore.address}`,
      signedAccountEntry ? signedAccountEntry.payload.value : undefined
    );

    if (!signedAccountEntry) {
      const signature = await this.identitySource.signText(mappingMsg(identity.id));
      this.logger.log(`Address mapping added to store ${mappingStore.address}`, signature);
      await mappingStore.add(signature);
    }

    this.status.logged = true;
  }

  public async logout() {
    this.useIdentity(this.instance.identity);
    this.status.logged = false;
  }

  public isLogged() {
    return this.status.logged;
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

  public getManifest(type: string) {
    return this.storeManifests.find(s => s.customType === type);
  }

  public async storeAddress(type: string, entity: any): Promise<string> {
    const storeManifest = this.getManifest(type);
    if (storeManifest === undefined) throw new Error(`store if type ${type} not found`);

    return this.instance.determineAddress(
      storeManifest.name(entity),
      storeManifest.type,
      storeManifest.options(entity)
    );
  }

  private async openStore(address: string | any): Promise<any> {
    // this.logger.log(`${address} -- Openning store`);
    let db;

    const hadDB = await this.instance._haveLocalData(this.instance.cache, address);

    if (this.instance.stores[address]) {
      // this.logger.log(`${address} -- Store loaded. HadDB: ${hadDB}`);
      db = this.instance.stores[address];
    } else if (this.storeQueue[address]) {
      // this.logger.log(`${address} -- Store already queue. HadDB: ${hadDB}`);
      db = this.storeQueue[address];
    } else {
      this.logger.log(`${address} -- Store init - first time. HadDB: ${hadDB}`);
      db = this.storeQueue[address] = this.instance
        .open(address, { identity: this.identity })
        .then(async store => {
          await store.load();
          return store;
        })
        .finally(() => delete this.storeQueue[address]);
    }

    db = await db;

    if (db.identity.id !== this.identity.id) db.setIdentity(this.identity);
    this.logger.log(`${db.address} -- Opened. HadDB: ${hadDB}`);

    if (!hadDB) {
      const result = await fetch(`${this.pinnerUrl}/includes?address=${address}`, {
        method: 'GET'
      });

      const { includes } = await result.json();

      if (includes) {
        this.logger.log(`${db.address} -- Awaiting replication. HadDB: ${hadDB}`);
        await new Promise(resolve => {
          db.events.on('replicated', async r => {
            this.logger.log(`${r} -- Replicated`);
            resolve();
          });
          /** timeout protection */
          setTimeout(() => resolve(), 5000);
        });
      }
    }

    return db;
  }

  public async getStore(type: string, entity?: any, pin: boolean = false): Promise<any> {
    const address = await this.storeAddress(type, entity);
    const store = this.openStore(address);
    if (pin) {
      this.pin(address);
    }
    return store;
  }

  public async dropStore(type: string, entity?: any): Promise<any> {
    const address = await this.storeAddress(type, entity);
    const store = await this.openStore(address);
    await store.drop();
    this.unpin(address);
  }

  public async pin(address: string) {
    if (this.pinnerUrl) {
      const addr = address.toString();
      const pinned = await this.pinnedCache.pinned.get(addr);
      if (!pinned) {
        this.logger.log(`pinning`, addr);
        fetch(`${this.pinnerUrl}/pin?address=${addr}`, {
          method: 'GET'
        }).then(response => {
          this.pinnedCache.pinned.put({ id: addr });
        });
      }
    }
  }

  public async unpin(address: string) {
    /** unpin is not working on the pinner */
    return;
    // if (this.pinnerUrl) {
    //   const addr = address.toString();
    //   this.logger.log(`un pinning`, addr);
    //   fetch(`${this.pinnerUrl}/unpin?address=${addr}`, {
    //     method: 'GET'
    //   }).then(response => {
    //     this.pinnedCache.pinned.delete(addr);
    //   });
    // }
  }
}

import OrbitDB from 'orbit-db';
import IPFS from 'ipfs';

import OrbitDBSet from '@tabcat/orbit-db-set';
import { IdentityProvider, Keystore } from '@tabcat/orbit-db-identity-provider-d';

import { Logger } from '@uprtcl/micro-orchestrator';
import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Perspective } from '@uprtcl/evees';

import { ProposalManifest } from './proposals.orbit-db';
import { EntropyGenerator } from '../identity-providers/entropy.generator';
import { ContextAccessController } from './context-access-controller';
import { ProposalsAccessController } from './proposals-access-controller';

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
  loggedIn: boolean = false;

  logger = new Logger('OrbitDB-Connection');

  constructor(
    protected pinnerUrl: string,
    protected ipfs: any,
    protected entropy: EntropyGenerator,
    options?: ConnectionOptions
  ) {
    super(options);
    if (!OrbitDB.AccessControllers.isSupported(ContextAccessController.type)) {
      OrbitDB.AccessControllers.addAccessController({ AccessController: ContextAccessController });
    }
    if (!OrbitDB.AccessControllers.isSupported(ProposalsAccessController.type)) {
      OrbitDB.AccessControllers.addAccessController({
        AccessController: ProposalsAccessController
      });
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

  public async proposalAddress(proposal: ProposalManifest): Promise<any> {
    return this.instance.determineAddress('proposal-store', 'eventlog', {
      accessController: { type: 'ipfs', write: proposal.owners },
      meta: {
        timestamp: proposal.timestamp
      }
    });
  }

  public async proposalsToPerspectiveAddress(toPerspectiveId: string): Promise<any> {
    return this.instance.determineAddress(`proposals-store/${toPerspectiveId}`, 'set', {
      accessController: { type: 'proposals', write: ['*'] }
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

  public async proposalStore(proposal: ProposalManifest, pin: boolean): Promise<any> {
    const address = await this.proposalAddress(proposal);
    const store = this.openStore(address);
    if (pin) {
      this.pin(address);
    }
    return store;
  }

  public async proposalsToPerspectiveStore(
    toPerspectiveId: string,
    pin: boolean = false
  ): Promise<any> {
    const address = await this.proposalsToPerspectiveAddress(toPerspectiveId);
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

import { Connection, ConnectionOptions } from '@uprtcl/multiplatform';
import { Perspective } from 'src/types';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import OrbitDB from 'orbit-db';
import OrbitDBSet from '@tabcat/orbit-db-set';
import attachIpfsStore from './context-access-controller';
import { IdentityProvider, Keystore } from '@tabcat/orbit-db-identity-provider-d';
OrbitDB.addDatabaseType(OrbitDBSet.type, OrbitDBSet);
OrbitDB.Identities.addIdentityProvider(IdentityProvider)

const keystorePath = (id) => `./orbitdb/identity/odbipd-${id}`

export interface OrbitDBConnectionOptions {
  directory?: string;
  peerId?: string;
  keystore?: any;
  cache?: any;
  identity?: any;
  offline?: boolean;
}

export class OrbitDBConnection extends Connection {
  public instance: null | any;
  private storeQueue = {};
  private identity: null | any = null;

  constructor(
    protected ipfsStore: IpfsStore,
    private signature: string,
    orbitdbOptions?: OrbitDBConnectionOptions,
    options?: ConnectionOptions
  ) {
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
    const id = this.signature.slice(-8)
    this.identity = await OrbitDB.Identities.createIdentity({
      keystore: new Keystore(keystorePath(id)),
      type: IdentityProvider.type,
      id: id,
      derive: this.signature
    })
    this.instance = await OrbitDB.createInstance(
      this.ipfsStore.client,
      { ...this.orbitdbOptions, identity }
    );
  }

  protected async disconnect(): Promise<void> {
    await this.identity.provider.keystore.close()
    await this.instance.stop()
    this.instance = null
  }

  public async perspectiveAddress(
    perspective: Perspective
  ): Promise<any> {
    return this.instance.determineAddress(
      'perspective-store',
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

  private openStore(
    address: string | any
  ): Promise<any> {
    if (this.instance.stores[address]) return this.instance.stores[address];
    if (this.storeQueue[address]) return this.storeQueue[address];

    return (this.storeQueue[address] = this.instance
      .open(address)
      .finally(() => delete this.storeQueue[address]));
  }

  public async perspectiveStore(
    perspective: Perspective
  ): Promise<any> {
    const address = await this.perspectiveAddress(perspective);
    return this.openStore(address);
  }

  public async contextStore(
    context: string
  ): Promise<any> {
    const address = await this.contextAddress(context);
    return this.openStore(address);
  }
}

'use strict';
import CBOR from 'cbor-js';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from '@uprtcl/evees';
import { IdentitySource, AddressMapping } from '@uprtcl/orbitdb-provider';

const type = 'context';

export function getContextAcl(identitySources: IdentitySource[]) {
  return class ContextAccessController extends IPFSAccessController {
    [x: string]: any;

    storeQueue: any = {};
    orbitdb: any;

    static get type() {
      return type;
    }

    constructor(orbitdb: any, options: any) {
      super(orbitdb._ipfs, options);
      this.orbitdb = orbitdb;
    }

    async canAppend(entry, identityProvider) {
      // Allow if access list contain the writer's publicKey or is '*'
      const key = entry.identity.id;
      try {
        if (this.write.includes(key) || this.write.includes('*')) {
          const perspectiveId = entry.payload.value;
          const result = await this.orbitdb._ipfs.dag.get(perspectiveId);
          const forceBuffer = Uint8Array.from(result.value);
          const { payload: perspective } = CBOR.decode(forceBuffer.buffer) as Signed<Perspective>;

          /** only the creator of a perspective can add or remove the perspective from the context store */
          if (perspective.creatorId !== key) return false;

          /** TODO: I cant reuse orbitdb custom here due to a circular dependency. investigate and fix. */
          const mappingEntity = {
            sourceId: perspective.remote,
            publickey: key
          };

          const address = this.orbitdb.determineAddress(
            AddressMapping.name(mappingEntity),
            AddressMapping.type,
            AddressMapping.options(mappingEntity)
          );

          let db;
          if (this.stores[address]) {
            // this.logger.log(`${address} -- Store loaded. HadDB: ${hadDB}`);
            db = this.instance.stores[address];
          } else if (this.storeQueue[address]) {
            // this.logger.log(`${address} -- Store already queue. HadDB: ${hadDB}`);
            db = this.storeQueue[address];
          } else {
            db = this.storeQueue[address] = this.orbitdb
              .open(address, { identity: this.identity })
              .then(async store => {
                await store.load();
                return store;
              });
          }

          db = await db;
          delete this.storeQueue[address];

          const [signedAccount] = db.iterator({ limit: 1 }).collect();

          if (signedAccount.account !== perspective.creatorId) {
            console.error(
              `${signedAccount.account} is not the expected creatorId ${perspective.creatorId}`
            );
          }

          const identitySource = identitySources.find(s => s.sourceId === perspective.remote);
          if (!identitySource) throw new Error(`identitySource ${perspective.remote} not found`);
          const valid = identitySource.verify(signedAccount.signature, signedAccount.account);

          if (!valid) {
            console.error(
              `${key} cannot write as user ${perspective.creatorId} on remote ${
                perspective.remote
              }. Signature ${JSON.stringify(signedAccount)} not valid`
            );
            return false;
          }

          // check identity is valid
          return identityProvider.verifyIdentity(entry.identity);
        }
      } catch (e) {
        console.error(e);
      }
      return false;
    }

    static async create(orbitdb, options: any = {}) {
      options = { ...options, ...{ write: options.write || [orbitdb.identity.id] } };
      return new ContextAccessController(orbitdb, options);
    }
  };
}

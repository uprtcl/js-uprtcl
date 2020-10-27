'use strict';
import CBOR from 'cbor-js';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from '@uprtcl/evees';
import { IdentitySource, AddressMapping, mappingMsg } from '@uprtcl/orbitdb-provider';

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

          /** TODO: I cant reuse orbitdb custom here due to a circular dependency. investigate and fix. */
          const mappingEntity = {
            sourceId: perspective.remote,
            key: key
          };

          const address = (
            await this.orbitdb.determineAddress(
              AddressMapping.name(mappingEntity),
              AddressMapping.type,
              AddressMapping.options(mappingEntity)
            )
          ).toString();

          let db;
          if (this.orbitdb.stores[address]) {
            // this.logger.log(`${address} -- Store loaded. HadDB: ${hadDB}`);
            db = this.orbitdb.stores[address];
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

          const [signedAccountEntry] = db.iterator({ limit: 1 }).collect();

          const signature = signedAccountEntry.payload.value;
          const identitySource = identitySources.find(s => s.sourceId === perspective.remote);
          if (!identitySource) throw new Error(`identitySource ${perspective.remote} not found`);

          const message = mappingMsg(key);
          const signer = await identitySource.verify(message, signature);

          if (signer !== perspective.creatorId) {
            console.error(
              `${key} cannot write as user ${perspective.creatorId} on remote ${perspective.remote}. Signature ${signature} not valid`
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

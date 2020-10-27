'use strict';
import CBOR from 'cbor-js';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from '@uprtcl/evees';
import { IdentitySource } from '@uprtcl/orbitdb-provider';
import { validateMappedAddress } from './validate.mapped.address';

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
      const orbitdbKey = entry.identity.id;
      try {
        if (this.write.includes(orbitdbKey) || this.write.includes('*')) {
          const perspectiveId = entry.payload.value;
          const result = await this.orbitdb._ipfs.dag.get(perspectiveId);
          const forceBuffer = Uint8Array.from(result.value);
          const { payload: perspective } = CBOR.decode(forceBuffer.buffer) as Signed<Perspective>;

          const identitySource = identitySources.find(s => s.sourceId === perspective.remote);

          if (!identitySource) {
            // if not identity source for this remote, creator must be the orbtidb identity
            if (perspective.creatorId !== orbitdbKey) {
              return false;
            }
          } else {
            const valid = await validateMappedAddress(
              this.orbitdb,
              identitySource,
              perspective.remote,
              perspective.creatorId,
              orbitdbKey
            );
            if (!valid) {
              console.error(
                `${orbitdbKey} cannot write as user ${perspective.creatorId} on remote ${perspective.remote}.`
              );
              return false;
            }
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

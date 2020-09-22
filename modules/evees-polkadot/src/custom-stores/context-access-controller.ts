'use strict';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
// import CBOR from 'cbor-js';
// import { Signed } from '@uprtcl/cortex';
// import { Perspective } from '@uprtcl/evees';

export const type = 'context-polkadot';

export class PolkadotContextAccessController extends IPFSAccessController {
  [x: string]: any;
  // Returns the type of the access controller
  static get type() {
    return type;
  }

  constructor(ipfs, options) {
    super(ipfs, options);
  }

  async canAppend(entry, identityProvider) {
    // Allow if access list contain the writer's publicKey or is '*'
    const key = entry.identity.id;
    try {
      if (this.write.includes(key) || this.write.includes('*')) {
        // const perspectiveId = entry.payload.value;
        // const result = await this._ipfs.dag.get(perspectiveId);
        // const forceBuffer = Uint8Array.from(result.value);
        // const { payload: perspective } = CBOR.decode(forceBuffer.buffer) as Signed<Perspective>;

        // if (perspective.creatorId !== entry.identity.id) return false;

        /** TODO. creatorId is a Polkadot account, entry.identity.id is an OrbitDB identity.
         * Once the kusama to orbitdb addresses mapping is working, use it here. It will be
         * a dependency on a third party server. It's ok because this is just a protection
         * to prevent invalid DB from being replicated */

        // check identity is valid
        // return identityProvider.verifyIdentity(entry.identity);
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  }

  static async create(orbitdb, options: any = {}) {
    options = { ...options, ...{ write: options.write || [orbitdb.identity.id] } };
    return new PolkadotContextAccessController(orbitdb._ipfs, options);
  }
}

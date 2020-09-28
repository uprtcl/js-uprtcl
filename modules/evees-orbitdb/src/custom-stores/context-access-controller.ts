'use strict';
import CBOR from 'cbor-js';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from '@uprtcl/evees';

const type = 'context';

export class ContextAccessController extends IPFSAccessController {
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
        const perspectiveId = entry.payload.value;
        const result = await this._ipfs.dag.get(perspectiveId);
        const forceBuffer = Uint8Array.from(result.value);
        const { payload: perspective } = CBOR.decode(forceBuffer.buffer) as Signed<Perspective>;

        // TODO: context is now fixed, so this is a common reverse mapping store only
        // Check this store is for this context. Should be simpler
        // if (perspective.context !== this.db.context) return false;

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
    return new ContextAccessController(orbitdb._ipfs, options);
  }
}

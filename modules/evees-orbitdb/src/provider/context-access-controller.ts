'use strict';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from '@uprtcl/evees';

const type = 'context';

function contextsAccesssControl(ipfsStore: IpfsStore) {
  return class ContextAccessController extends IPFSAccessController {
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
          const { payload: perspective } = (await ipfsStore.get(perspectiveId)) as Signed<
            Perspective
          >;
          if (perspective.creatorId !== entry.identity.id) return false;

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
      return new ContextAccessController(orbitdb._ipfs, options);
    }
  };
}

export { contextsAccesssControl };

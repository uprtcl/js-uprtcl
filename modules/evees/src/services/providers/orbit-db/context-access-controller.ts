
'use strict'
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { IpfsStore } from '@uprtcl/ipfs-provider';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from 'src/types';

const type = 'context'

function attachIpfsStore (ipfsStore: IpfsStore) {
  return class ContextAccessController extends IPFSAccessController {
    // Returns the type of the access controller
    static get type () { return type }

    async canAppend (entry, identityProvider) {
      // Allow if access list contain the writer's publicKey or is '*'
      const key = entry.identity.id
      if (this.write.includes(key) || this.write.includes('*')) {
        const { payload: perspective } = (await ipfsStore.get(
          perspectiveId
        )) as Signed<Perspective>;
        if (perspective.creatorId !== entry.identity) return false;
        // check identity is valid
        return identityProvider.verifyIdentity(entry.identity);
      }
      return false;
    }

    static async create (orbitdb, options = {}) {
      options = { ...options, ...{ write: options.write || [orbitdb.identity.id] } };
      return new ContextAccessController(orbitdb._ipfs, options);
    }
  }
}


module.exports = attachIpfsStore;

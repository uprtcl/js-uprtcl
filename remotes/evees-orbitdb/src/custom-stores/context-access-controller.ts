'use strict';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { IdentitySource } from '@uprtcl/orbitdb-provider';
import { checkToPerspectiveCreator } from './validate.mapped.address';

const type = 'context';

export function getContextAcl(identitySources: IdentitySource[]) {
  return class ContextAccessController extends IPFSAccessController {
    [x: string]: any;

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
        return identityProvider.verifyIdentity(entry.identity);

        /** This works fine for external accounts on the identityProvider, but for internal
         * accounts who can't sign, it does not work. It seems possible to use the signaling
         * contract to let contracts "sign/approve" entries, but this will require some time.
         */
        // if (this.write.includes(orbitdbKey) || this.write.includes('*')) {
        //   const perspectiveId = entry.payload.value;

        //   const valid = await checkToPerspectiveCreator(
        //     this.orbitdb,
        //     perspectiveId,
        //     orbitdbKey,
        //     identitySources
        //   );

        //   if (!valid) {
        //     return false;
        //   }

        //   // check identity is valid
        //   return identityProvider.verifyIdentity(entry.identity);
        // }
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

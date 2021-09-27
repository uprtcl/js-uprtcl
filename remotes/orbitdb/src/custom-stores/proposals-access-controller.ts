import { IdentitySource } from '@uprtcl/orbitdb-provider';
import CBOR from 'cbor-js';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { checkToPerspectiveCreator } from './validate.mapped.address';

const type = 'proposals';

export function getProposalsAcl(identitySources: IdentitySource[]) {
  return class ProposalsAccessController extends IPFSAccessController {
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
        if (this.write.includes(orbitdbKey) || this.write.includes('*')) {
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
      return new ProposalsAccessController(orbitdb, options);
    }
  };
}

'use strict';
import { IdentitySource } from '@uprtcl/orbitdb-provider';
import CBOR from 'cbor-js';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { ProposalManifest } from '../provider/proposals.orbit-db';
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
          const proposalId = entry.payload.value;
          const result = await this._ipfs.dag.get(proposalId);
          const forceBuffer = Uint8Array.from(result.value);
          const proposalManifest = CBOR.decode(forceBuffer.buffer) as ProposalManifest;

          // the proposal owners can add or remove the proposal to a "proposals" store
          // otherwise, the toPerspective creator can add or remove
          if (!proposalManifest.owners.includes(orbitdbKey)) {
            const isToPerspectiveOwner = await checkToPerspectiveCreator(
              this.orbitdb,
              proposalManifest.toPerspectiveId,
              orbitdbKey,
              identitySources
            );

            if (!isToPerspectiveOwner) {
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
      return new ProposalsAccessController(orbitdb, options);
    }
  };
}

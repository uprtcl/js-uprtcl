'use strict';
import CBOR from 'cbor-js';
import IPFSAccessController from 'orbit-db-access-controllers/src/ipfs-access-controller';
import { Signed } from '@uprtcl/cortex';
import { Perspective } from '@uprtcl/evees';
import { ProposalManifest } from './proposals.orbit-db';

const type = 'proposals';

export class ProposalsAccessController extends IPFSAccessController {
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
        const proposalId = entry.payload.value;
        const result = await this._ipfs.dag.get(proposalId);
        const forceBuffer = Uint8Array.from(result.value);
        const proposalManifest = CBOR.decode(forceBuffer.buffer) as ProposalManifest;

        if (!proposalManifest.owners.includes(entry.identity.id)) return false;

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
    return new ProposalsAccessController(orbitdb._ipfs, options);
  }
}

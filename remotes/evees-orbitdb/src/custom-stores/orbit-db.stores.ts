import { Entity, Signed } from '@uprtcl/cortex';
import { Perspective, Secured } from '@uprtcl/evees';
import { CustomStore } from '@uprtcl/orbitdb-provider';

import { ProposalManifest } from '../provider/proposals.orbit-db';

export enum EveesOrbitDBEntities {
  Perspective = 'PERSPECTIVE',
  Context = 'CONTEXT',
  Proposal = 'PROPOSAL',
  ProposalsToPerspective = 'PROPOSALS_TO_PERSPECTIVE'
}

export const perspective: CustomStore = {
  customType: EveesOrbitDBEntities.Perspective,
  type: 'eventlog',
  name: (perspective: Secured<Perspective>) => `perspective-store/${perspective.id}`,
  options: (perspective: Secured<Perspective>) => {
    return {
      accessController: { type: 'ipfs', write: [perspective.object.payload.creatorId] },
      meta: { timestamp: perspective.object.payload.timestamp }
    };
  }
};

export const context: CustomStore = {
  customType: EveesOrbitDBEntities.Context,
  type: 'set',
  name: entity => `context-store/${entity.context}`,
  options: entity => {
    return {
      accessController: { type: 'context', write: ['*'] }
    };
  }
};

export const proposal: CustomStore = {
  customType: EveesOrbitDBEntities.Proposal,
  type: 'eventlog',
  name: (proposal: Entity<ProposalManifest>) => `proposal-store/${proposal.id}`,
  options: (proposal: Entity<ProposalManifest>) => {
    return {
      accessController: { type: 'ipfs', write: proposal.object.owners },
      meta: { timestamp: proposal.object.timestamp }
    };
  }
};

export const proposals: CustomStore = {
  customType: EveesOrbitDBEntities.ProposalsToPerspective,
  type: 'set',
  name: entity => `proposals-store/${entity.toPerspectiveId}`,
  options: entity => {
    return {
      accessController: { type: 'proposals', write: ['*'] }
    };
  }
};

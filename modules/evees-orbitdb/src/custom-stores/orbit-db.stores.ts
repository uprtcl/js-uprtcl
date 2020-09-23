import { CustomStore } from '@uprtcl/orbitdb-provider';

export enum EveesOrbitDBEntities {
  Perspective = 'PERSPECTIVE',
  Context = 'CONTEXT',
  Proposal = 'PROPOSAL',
  ProposalsToPerspective = 'PROPOSALS_TO_PERSPECTIVE'
}

export const perspective: CustomStore = {
  customType: EveesOrbitDBEntities.Perspective,
  type: 'eventlog',
  name: () => 'perspective-store',
  options: perspective => {
    return {
      accessController: { type: 'ipfs', write: [perspective.creatorId] },
      meta: { timestamp: perspective.timestamp }
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
  name: () => 'proposal-store',
  options: proposal => {
    return {
      accessController: { type: 'ipfs', write: proposal.owners },
      meta: { timestamp: proposal.timestamp }
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

import {
  ContextAccessController,
  ProposalsAccessController,
  EveesOrbitDBEntities
} from '@uprtcl/evees-orbitdb';

export const acls = [ContextAccessController, ProposalsAccessController];
export const stores = {
  [EveesOrbitDBEntities.Perspective]: {
    recognize: entity => entity.type === EveesOrbitDBEntities.Perspective,
    type: 'eventlog',
    name: () => 'perspective-store',
    options: perspective => {
      return {
        accessController: { type: 'ipfs', write: [perspective.creatorId] },
        meta: { timestamp: perspective.timestamp }
      };
    }
  },
  [EveesOrbitDBEntities.Context]: {
    recognize: entity => entity.type === EveesOrbitDBEntities.Context,
    type: 'set',
    name: entity => `context-store/${entity.context}`,
    options: entity => {
      return {
        accessController: { type: 'context', write: ['*'] }
      };
    }
  },
  [EveesOrbitDBEntities.Proposal]: {
    recognize: entity => entity.type === EveesOrbitDBEntities.Proposal,
    type: 'eventlog',
    name: () => 'proposal-store',
    options: perspective => {
      return {
        accessController: { type: 'ipfs', write: [perspective.creatorId] },
        meta: { timestamp: perspective.timestamp }
      };
    }
  },
  [EveesOrbitDBEntities.ProposalsToPerspective]: {
    recognize: entity => entity.type === EveesOrbitDBEntities.ProposalsToPerspective,
    type: 'set',
    name: entity => `proposals-store/${entity.toPerspectiveId}`,
    options: entity => {
      return {
        accessController: { type: 'proposals', write: ['*'] }
      };
    }
  }
};

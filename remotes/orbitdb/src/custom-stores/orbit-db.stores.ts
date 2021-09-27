import { CustomStore } from '@uprtcl/orbitdb-provider';
import { Perspective, Secured } from '@uprtcl/evees';

export enum EveesOrbitDBEntities {
  Perspective = 'PERSPECTIVE',
  Context = 'CONTEXT',
  Proposal = 'PROPOSAL',
  ProposalsToPerspective = 'PROPOSALS_TO_PERSPECTIVE',
}

export const perspective: CustomStore = {
  customType: EveesOrbitDBEntities.Perspective,
  type: 'eventlog',
  name: (perspective: Secured<Perspective>) => `perspective-store/${perspective.hash}`,
  options: (perspective: Secured<Perspective>) => {
    return {
      accessController: { type: 'ipfs', write: [perspective.object.payload.creatorId] },
      meta: { timestamp: perspective.object.payload.timestamp },
    };
  },
};

export const context: CustomStore = {
  customType: EveesOrbitDBEntities.Context,
  type: 'set',
  name: (entity) => `context-store/${entity.context}`,
  options: (entity) => {
    return {
      accessController: { type: 'context', write: ['*'] },
    };
  },
};

export const proposals: CustomStore = {
  customType: EveesOrbitDBEntities.ProposalsToPerspective,
  type: 'set',
  name: (entity) => `proposals-store/${entity.toPerspectiveId}`,
  options: (entity) => {
    return {
      accessController: { type: 'proposals', write: ['*'] },
    };
  },
};

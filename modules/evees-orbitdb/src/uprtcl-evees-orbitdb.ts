// Required by inversify
import 'reflect-metadata';

export { EveesOrbitDB } from './provider/evees.orbit-db';
export { EveesAccessControlOrbitDB } from './provider/evees-acl.orbit-db';
export { EveesOrbitDBModule } from './evees-orbitdb.module';
export { ProposalsOrbitDB } from './provider/proposals.orbit-db';
export { getContextAclContructor } from './custom-stores/context-access-controller';
export { ProposalsAccessController } from './custom-stores/proposals-access-controller';

export {
  EveesOrbitDBEntities,
  perspective as PerspectiveStore,
  context as ContextStore,
  proposal as ProposalStore,
  proposals as ProposalsToPerspectiveStore
} from './custom-stores/orbit-db.stores';

import { Logger } from '../../../utils/logger';
import { ClientExplore } from '../../interfaces/client.explore';
import { ClientMutationBase } from '../cached/client.mutation.base';
import { MutationStoreMemory } from './mutation.store.memory';

export class ClientMutationMemory extends ClientMutationBase {
  logger = new Logger('ClientOnMemory');

  constructor(readonly base: ClientExplore, readonly name: string = 'OnMemoryClient') {
    super(base, new MutationStoreMemory(), name);
  }
}

import { Logger } from '../../../utils/logger';
import { ClientAndExploreCached } from '../../interfaces/client.explore';
import { ClientMutationBase } from '../base/client.mutation.base';
import { MutationStoreMemory } from './mutation.store.memory';

export class ClientMutationMemory extends ClientMutationBase {
  logger = new Logger('ClientOnMemory');

  constructor(
    readonly base: ClientAndExploreCached,
    readonly condensate: boolean = false,
    readonly name: string = 'OnMemoryClient'
  ) {
    super(base, new MutationStoreMemory(), condensate, name);
  }
}

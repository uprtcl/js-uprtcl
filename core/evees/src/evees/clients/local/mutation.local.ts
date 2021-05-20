import { EntityResolver, ClientExplore, EntityRemote } from '../../interfaces/index';
import { Logger } from '../../../utils/logger';
import { ClientMutationBase } from '../base/client.mutation.base';
import { MutationStoreLocal } from './mutation.store.local';

export class ClientMutationLocal extends ClientMutationBase {
  logger = new Logger('Client-Local');

  constructor(
    readonly base: ClientExplore,
    protected entityResolver: EntityResolver,
    entityRemote: EntityRemote,
    readonly name: string = 'local-mutation'
  ) {
    super(base, new MutationStoreLocal(name, entityResolver, entityRemote), name);
  }
}

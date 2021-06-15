import { EntityResolver, ClientAndExplore, EntityRemote } from '../../interfaces';
import { Logger } from '../../../utils/logger';
import { ClientMutationBase } from '../base/client.mutation.base';
import { MutationStoreLocal } from './mutation.store.local';

export class ClientMutationLocal extends ClientMutationBase {
  logger = new Logger('Client-Local');

  constructor(
    readonly base: ClientAndExplore,
    protected entityResolver: EntityResolver,
    entityRemote: EntityRemote,
    readonly condensate: boolean = false,
    readonly name: string = 'local-mutation'
  ) {
    super(base, new MutationStoreLocal(name, entityResolver, entityRemote), condensate, name);
  }
}

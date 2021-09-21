import { EntityResolver, ClientAndExploreCached, EntityRemote } from '../../interfaces';
import { Logger } from '../../../utils/logger';
import { ClientMutationBase } from '../base/client.mutation.base';
import { MutationStoreLocal } from './mutation.store.local';

export class ClientMutationLocal extends ClientMutationBase {
  logger = new Logger('Client-Local');

  constructor(
    readonly base: ClientAndExploreCached,
    protected entityResolver: EntityResolver,
    readonly entityCache: EntityRemote,
    readonly condensate: boolean = false,
    readonly name: string = 'local-mutation'
  ) {
    super(base, new MutationStoreLocal(name, entityResolver, entityCache), condensate, name);
  }
}

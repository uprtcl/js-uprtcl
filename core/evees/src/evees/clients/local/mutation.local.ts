import { EntityResolver, ClientExplore } from '../../interfaces/index';
import { Logger } from '../../../utils/logger';
import { ClientMutationBase } from '../base/client.mutation.base';
import { MutationStoreLocal } from './mutation.store.local';

export class ClientMutationLocal extends ClientMutationBase {
  logger = new Logger('Client-Local');

  constructor(
    readonly base: ClientExplore,
    protected entityResolver: EntityResolver,
    readonly name: string = 'ClientLocal'
  ) {
    super(base, new MutationStoreLocal(name, entityResolver), name);
  }
}

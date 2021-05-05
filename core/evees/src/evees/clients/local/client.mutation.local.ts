import { EntityResolver } from '../../interfaces/entity.resolver';
import { Logger } from '../../../utils/logger';

import { ClientExplore } from '../../interfaces/client.explore';
import { ClientMutationBase } from '../base/client.mutation.base';
import { MutationStoreLocal } from './mutation.store.local';

const LOGINFO = false;

export class ClientMutationLocal extends ClientMutationBase {
  logger = new Logger('ClientCachedLocal');

  constructor(
    readonly base: ClientExplore,
    entityResolver: EntityResolver,
    readonly name: string = 'local'
  ) {
    super(base, new MutationStoreLocal(`${name}-cache`, entityResolver), `${name}-client`);
  }
}

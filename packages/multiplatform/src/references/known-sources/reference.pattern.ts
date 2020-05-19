import CID from 'cids';
import { injectable, inject } from 'inversify';

import { Pattern, Entity } from '@uprtcl/cortex';
import { ResolveEntity } from '../../behaviours/resolve-entity';
import { MultiSourceService } from './multi-source.service';
import { DiscoveryBindings } from '../../bindings';

export class KnownSourcesRefPattern extends Pattern<string> {
  recognize(reference: any) {
    if (typeof reference !== 'string') return false;
    try {
      const cid = new CID(reference);
      const check1 = CID.isCID(cid);
      CID.validateCID(cid);
      return !!check1;
    } catch (e) {
      return false;
    }
  }

  type: string | undefined = undefined;
}

@injectable()
export class KnownSourcesResolver implements ResolveEntity {
  constructor(
    @inject(DiscoveryBindings.MultiSourceService) protected multiSource: MultiSourceService
  ) {}

  resolve = async (reference: string): Promise<Entity<any> | undefined> => {
    return this.multiSource.get(reference);
  };
}

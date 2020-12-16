import { html } from 'lit-element';

import { AccessControlService, Perspective } from '@uprtcl/evees';
import { Lens } from '@uprtcl/lenses';
import { CASStore } from '@uprtcl/multiplatform';
import { Signed } from '@uprtcl/cortex';

export class EveesAccessControlFixed implements AccessControlService {
  constructor(protected store: CASStore) {}

  async getOwner(perspectiveId: string) {
    const perspective = (await this.store.get(perspectiveId)) as Signed<Perspective>;
    return perspective.payload.creatorId;
  }

  async canWrite(uref: string, userId: string) {
    return userId === (await this.getOwner(uref));
  }

  lense(): Lens {
    return {
      name: 'evees-blockchain:access-control',
      type: 'access-control',
      render: (entity: any) => {
        return html`
          <evees-permissions-fixed uref=${entity.uref}> </evees-permissions-fixed>
        `;
      }
    };
  }
}

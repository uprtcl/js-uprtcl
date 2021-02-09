import { html } from 'lit-element';

import { AccessControl, CASStore, Lens, Perspective, Signed } from '@uprtcl/evees';

export class EveesAccessControlFixed implements AccessControl {
  constructor(protected store: CASStore) {}

  async getOwner(perspectiveId: string) {
    const perspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);
    return perspective.object.payload.creatorId;
  }

  async canUpdate(uref: string, userId: string) {
    return userId === (await this.getOwner(uref));
  }

  lense(): Lens {
    return {
      name: 'evees-blockchain:access-control',
      type: 'access-control',
      render: (entity: any) => {
        return html` <evees-permissions-fixed uref=${entity.uref}> </evees-permissions-fixed> `;
      },
    };
  }
}

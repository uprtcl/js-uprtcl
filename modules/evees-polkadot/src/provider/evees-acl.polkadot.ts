import { html } from 'lit-element';

import { AccessControlService } from '@uprtcl/evees';
import { Lens } from '@uprtcl/lenses';

export class EveesAccessControlPolkadot implements AccessControlService {
  constructor(protected store: CASStore) {}

  async getOwner(perspectiveId: string) {
    const perspective = await this.store.get(perspectiveId);
    return perspective.object.payload.creatorId;
  }

  async canWrite(uref: string, userId: string) {
    return userId === (await this.getOwner(uref));
  }

  lense(): Lens {
    return {
      name: 'evees-polkadot:access-control',
      type: 'access-control',
      render: (uref: string) => {
        return html`
          <evees-polkadot-permissions uref=${uref}> </evees-polkadot-permissions>
        `;
      }
    };
  }
}

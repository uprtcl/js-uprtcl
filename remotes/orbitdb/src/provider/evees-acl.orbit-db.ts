import { AccessControl, CASStore, Lens, Perspective, Signed } from '@uprtcl/evees';
import { html } from 'lit-element';

export class EveesAccessControlOrbitDB implements AccessControl {
  store!: CASStore;

  constructor() {}

  setStore(store) {
    this.store = store;
  }

  async getOwner(perspectiveId: string): Promise<any | undefined> {
    const singedPerspective = await this.store.getEntity<Signed<Perspective>>(perspectiveId);
    return singedPerspective.object.payload.creatorId;
  }

  async canUpdate(uref: string, userId: string) {
    return userId === (await this.getOwner(uref));
  }

  lense(): Lens {
    return {
      name: 'evees-http:access-control',
      type: 'access-control',
      render: (entity: any) => {
        return html` <evees-orbitdb-permissions uref=${entity.uref}> </evees-orbitdb-permissions> `;
      },
    };
  }
}

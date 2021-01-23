import { html } from 'lit-element';

export class EveesAccessControlOrbitDB implements AccessControlService {
  constructor(protected store: CASStore) {}

  async getOwner(perspectiveId: string): Promise<any | undefined> {
    const singedPerspective = (await this.store.get(perspectiveId)) as Signed<Perspective>;
    return singedPerspective.payload.creatorId;
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
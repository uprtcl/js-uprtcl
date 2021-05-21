import { html } from 'lit-element';
import { AccessControl, EntityResolver, Perspective, Signed } from '@uprtcl/evees';
import { Lens } from '@uprtcl/evees-ui';

export class EveesAccessControlOrbitDB implements AccessControl {
  entityResolver!: EntityResolver;

  constructor() {}

  setEntityResolver(resolver: EntityResolver) {
    this.entityResolver = resolver;
  }

  async getOwner(perspectiveId: string): Promise<any | undefined> {
    const singedPerspective = await this.entityResolver.getEntity<Signed<Perspective>>(
      perspectiveId
    );
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

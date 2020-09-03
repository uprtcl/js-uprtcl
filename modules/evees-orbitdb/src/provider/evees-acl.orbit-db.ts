import { Container } from 'inversify';
import { ApolloClient } from 'apollo-boost';
import { html } from 'lit-element';

import { CASStore, loadEntity } from '@uprtcl/multiplatform';
import { Signed, Entity } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Perspective, AccessControlService } from '@uprtcl/evees';
import { Lens } from '@uprtcl/lenses';

export class EveesAccessControlOrbitDB implements AccessControlService {
  constructor(protected container: Container, protected store: CASStore) {}

  async getOwner(perspectiveId: string): Promise<any | undefined> {
    const client: ApolloClient<any> = this.container.get(
      ApolloClientModule.bindings.Client
    );

    const singedPerspective = (await loadEntity(
      client,
      perspectiveId
    )) as Entity<Signed<Perspective>>;
    return singedPerspective.object.payload.creatorId;
  }

  async canWrite(uref: string, userId: string) {
    return userId === (await this.getOwner(uref));
  }

  lense(): Lens {
    return {
      name: 'evees-http:access-control',
      type: 'access-control',
      render: (entity: string) => {
        return html`
          <evees-orbitdb-permissions uref=${entity}>
          </evees-orbitdb-permissions>
        `;
      },
    };
  }
}

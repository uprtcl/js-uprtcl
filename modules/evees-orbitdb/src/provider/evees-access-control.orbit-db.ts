import { Container } from 'inversify';
import { ApolloClient } from 'apollo-boost';

import {
  OwnerAccessControlService,
  OwnerPermissions,
} from '@uprtcl/access-control';
import { CASStore, loadEntity } from '@uprtcl/multiplatform';
import { Signed, Entity } from '@uprtcl/cortex';
import { ApolloClientModule } from '@uprtcl/graphql';

import { Perspective } from '@uprtcl/evees';

export class EveesAccessControlOrbitDB implements OwnerAccessControlService {
  constructor(protected container: Container, protected store: CASStore) {}

  changeOwner(ref: string, newOwnerId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async setCanWrite(ref: string, userId: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async getPermissions(
    perspectiveId: string
  ): Promise<OwnerPermissions | undefined> {
    const client: ApolloClient<any> = this.container.get(
      ApolloClientModule.bindings.Client
    );

    const singedPerspective = (await loadEntity(
      client,
      perspectiveId
    )) as Entity<Signed<Perspective>>;
    return { owner: singedPerspective.object.payload.creatorId };
  }

  setPermissions(
    hash: string,
    newPersmissions: OwnerPermissions
  ): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

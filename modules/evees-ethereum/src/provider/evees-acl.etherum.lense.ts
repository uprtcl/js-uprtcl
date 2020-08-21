import { LitElement, property, html, query, css } from 'lit-element';
import { ApolloClient, gql } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternRecognizer, Signed } from '@uprtcl/cortex';
import { EveesModule, EveesHelpers, Perspective, EveesRemote } from '@uprtcl/evees';
import { loadEntity } from '@uprtcl/multiplatform';
import { EveesEthereumModule } from 'src/evees-ethereum.module';
import { EveesEthereum } from './evees.ethereum';
import { GET_PERSP_HASH, UPDATE_OWNER_BATCH } from './common';

export class PermissionsEthereum extends moduleConnect(LitElement) {
  @property({ type: String })
  uref!: string;

  @property({ attribute: false })
  owner!: boolean;

  @property({ attribute: false })
  canWrite!: boolean;

  @property({ attribute: false })
  newOwnerAddress!: string;

  @property({ attribute: false })
  showDialog: boolean = false;

  @property({ attribute: false })
  changingOwner: boolean = false;

  @query('#new-address')
  newAddressEl!: any;

  client!: ApolloClient<any>;
  recognizer!: PatternRecognizer;
  remote!: EveesEthereum;

  async firstUpdated() {
    this.client = this.request(ApolloClientModule.bindings.Client);
    this.recognizer = this.request(CortexModule.bindings.Recognizer);
    const perspective = await loadEntity<Signed<Perspective>>(this.client, this.perspectiveId);
    if (perspective === undefined) throw new Error(`perspective ${this.perspectiveId} not found`);

    this.remote = (this.requestAll(EveesModule.bindings.EveesRemote) as EveesRemote[]).find((r) => r.id === perspective.object.payload.remote);
  }

  async changeOwner(uref: string, newOwnerId: string): Promise<void> {
    
    const currentAccessControl = await EveesHelpers.getAccessControl(
      this.client,
      uref
    );
    if (!currentAccessControl)
      throw new Error(`${uref} don't have access control`);

    const remote = await EveesHelpers.getPerspectiveRemoteId(this.client, uref);
    if (!remote) throw new Error(`${uref} is not a perspective`);

    /** recursively search for children owned by this owner and change also those */
    const descendants = await EveesHelpers.getDescendants(
      this.client,
      this.recognizer,
      uref
    );

    /** filter the descendants with the same owner and in the same remote */
    const asyncFilter = async (arr, predicate) =>
      Promise.all(arr.map(predicate)).then((results) =>
        arr.filter((_v, index) => results[index])
      );

    const owned = await asyncFilter(descendants, async (descendantRef) => {
      let descendant = await loadEntity<any>(this.client, descendantRef);
      if (!descendant) throw new Error('descendant not found');

      let descendantType: string = this.recognizer.recognizeType(descendant);
      if (descendantType !== EveesModule.bindings.PerspectiveType) return false;

      const accessControl = await EveesHelpers.getAccessControl(
        this.client,
        descendantRef
      );
      if (!accessControl) return false;

      let entityType: string = this.recognizer.recognizeType(
        accessControl.permissions
      );

      if (
        entityType === 'OwnerPermissions' &&
        accessControl.permissions.owner ===
          currentAccessControl.permissions.owner
      ) {
        const thisRemoteId = await EveesHelpers.getPerspectiveRemoteId(
          this.client,
          descendantRef
        );
        return thisRemoteId === remote;
      }
    });

    const all = [uref].concat(owned);
    const getPerspectivesIdsHashes = all.map(async (id) =>
      this.remote.uprtclRoot.call(GET_PERSP_HASH, [id])
    );
    const perspectivesIdsHashes = await Promise.all(getPerspectivesIdsHashes);

    await this.remote.uprtclRoot.send(UPDATE_OWNER_BATCH, [
      perspectivesIdsHashes,
      newOwnerId,
    ]);
  }

  async getOwner(hash: string): Promise<string> {
    const perspectiveIdHash = await this.remote.uprtclRoot.call(GET_PERSP_HASH, [
      hash,
    ]);

    const owner = await this.remote.uprtclRoot.call(GET_PERSP_OWNER, [
      perspectiveIdHash,
    ]);
    return owner.toLowerCase();
  }

  async showTransferDialog() {
    this.showDialog = true;
    await this.updateComplete;

    this.newAddressEl.focus();
  }

  async changeOwnerClicked() {
    this.showDialog = false;
    this.changingOwner = true;

    const newAddress = this.newAddressEl.value;

    await this.changeOwner(this.perspectiveId, newAddress);

    this.dispatchEvent(
      new CustomEvent('permissions-updated', {
        bubbles: true,
        composed: true,
        cancelable: true,
      })
    );

    this.changingOwner = false;
  }

  renderOwner() {
    return html`<evees-author
      user-id=${this.owner}
    ></evees-author>`;
  }

  renderDialog() {
    return html`
      <evees-dialog
        primary-text="Transfer"
        secondary-text="Cancel"
        @primary=${this.changeOwner}
        @secondary=${() => (this.showDialog = false)}
        show-secondary="true"
      >
        <uprtcl-textfield
          class="address-field"
          id="new-address"
          .label=${this.t('access-control:new-owner-address')}
        ></uprtcl-textfield>
      </evees-dialog>
    `;
  }

  render() {
    return html`
      ${this.showDialog ? this.renderDialog() : ''}
      <div class="row title">
        <strong>${this.t('access-control:owner')}:</strong> ${this.renderOwner()}
      </div>
      ${this.canWrite
        ? html`
            <evees-loading-button
              icon="swap_horizontal"
              @click=${this.showTransferDialog}
              loading=${this.changingOwner ? 'true' : 'false'}
              label=${this.t('access-control:transfer-ownership')}
            >
            </evees-loading-button>
          `
        : ''}
    `;
  }

  static get styles() {
    return css`
      mwc-button {
        width: 220px;
      }

      .address-field {
        margin-top: 50px;
      }

      .title {
        margin-bottom: 32px;
      }
      .row {
        width: 100%;
      }

      evees-author {
        margin: 0 auto;
      }
    `;
  }
}

import { LitElement, property, html, query, css } from 'lit-element';
import { ApolloClient } from 'apollo-boost';

import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CortexModule, PatternRecognizer } from '@uprtcl/cortex';
import { EveesModule, EveesHelpers, EveesRemote } from '@uprtcl/evees';
import { EveesEthereum } from './evees.ethereum';
import { GET_PERSP_HASH, UPDATE_OWNER_BATCH, GET_PERSP_OWNER } from './common';

export class PermissionsEthereum extends moduleConnect(LitElement) {
  @property({ type: String })
  uref!: string;

  @property({ attribute: false })
  loading: boolean = false;

  @property({ attribute: false })
  owner!: string;

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
    this.load();
  }

  async load() {
    this.loading = true;
    const remoteId = await EveesHelpers.getPerspectiveRemoteId(
      this.client,
      this.uref
    );
    if (remoteId === undefined) throw new Error('remote not found');

    this.remote = (this.requestAll(
      EveesModule.bindings.EveesRemote
    ) as EveesRemote[]).find((r) => r.id === remoteId) as EveesEthereum;

    this.owner = await this.getOwner(this.uref);
    this.canWrite = await this.remote.canWrite(this.uref);

    this.loading = false;
  }

  async changeOwner(uref: string, newOwnerId: string): Promise<void> {
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
      const thisRemoteId = await EveesHelpers.getPerspectiveRemoteId(
        this.client,
        descendantRef
      );
      return thisRemoteId === remote;
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
    const perspectiveIdHash = await this.remote.uprtclRoot.call(
      GET_PERSP_HASH,
      [hash]
    );

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

    await this.changeOwner(this.uref, newAddress);

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
    return html`<evees-author user-id=${this.owner}></evees-author>`;
  }

  renderDialog() {
    return html`
      <uprtcl-dialog
        primary-text="Transfer"
        secondary-text="Cancel"
        @primary=${this.changeOwner}
        @secondary=${() => (this.showDialog = false)}
        show-secondary="true"
      >
        <p>Transfer the ownership of all these perspectives to:</p>
        <uprtcl-textfield
          class="address-field"
          id="new-address"
          .label=${this.t('access-control:new-owner-address')}
        ></uprtcl-textfield>
      </uprtcl-dialog>
    `;
  }

  render() {
    return html`
      ${this.showDialog ? this.renderDialog() : ''}
      ${this.loading
        ? html`<uprtcl-loading></uprtcl-loading>`
        : html`<div class="row title">
              <strong>${this.t('access-control:owner')}:</strong>
              ${this.renderOwner()}
            </div>
            ${this.canWrite
              ? html`
                  <uprtcl-button-loading
                    icon="swap_horizontal"
                    @click=${this.showTransferDialog}
                    loading=${this.changingOwner ? 'true' : 'false'}
                  >
                    ${this.t('access-control:transfer-ownership')}
                  </uprtcl-button-loading>
                `
              : ''}`}
    `;
  }

  static get styles() {
    return css`
      uprtcl-button {
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

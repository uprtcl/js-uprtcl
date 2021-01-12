import { LitElement, property, html, css, query } from 'lit-element';

import { moduleConnect, Logger } from '@uprtcl/micro-orchestrator';
import { MenuConfig, UprtclDialog } from '@uprtcl/common-ui';

import { Proposal } from '../types';
import { EveesBindings } from '../bindings';
import { EveesDiff } from './evees-diff';
import { ContentUpdatedEvent } from './events';
import { Evees } from '../services/evees.service';
import { Entity } from '@uprtcl/cortex';
import { ClientOnMemory } from '../services/clients/client.memory';
import { RemoteWithUI } from '../services/remote.with-ui';

export class EveesProposalRow extends moduleConnect(LitElement) {
  logger = new Logger('EVEES-PROPOSAL-ROW');

  @property({ type: String, attribute: 'proposal-id' })
  proposalId!: string;

  @property({ type: String, attribute: 'remote-id' })
  remoteId!: string;

  @property({ attribute: false })
  loading: boolean = true;

  @property({ attribute: false })
  loadingCreator: boolean = true;

  @property({ attribute: false })
  showDiff: Boolean = false;

  @property({ attribute: false })
  authorId: string | undefined = undefined;

  @property({ attribute: false })
  authorRemote: string | undefined = undefined;

  @property({ attribute: false })
  canRemove: Boolean = false;

  @query('#updates-dialog')
  updatesDialogEl!: UprtclDialog;

  @query('#evees-update-diff')
  eveesDiffEl!: EveesDiff;

  proposal!: Entity<Proposal>;
  executed: boolean = false;
  canExecute: boolean = false;

  protected evees!: Evees;
  protected toRemote!: RemoteWithUI;

  async firstUpdated() {
    this.evees = this.request(EveesBindings.Evees);
    this.load();
  }

  updated(changedProperties) {
    if (changedProperties.has('proposal-id')) {
      this.load();
    }
  }

  async load() {
    this.loading = true;
    this.loadingCreator = true;

    this.proposal = await this.evees.getPerspectiveData(this.proposalId);

    const fromPerspective = this.proposal.object.fromPerspectiveId
      ? await this.evees.client.store.getEntity(this.proposal.object.fromPerspectiveId)
      : undefined;

    this.toRemote = await this.evees.getPerspectiveRemote(this.proposal.object.toPerspectiveId);

    /** the author is the creator of the fromPerspective */
    this.authorId = fromPerspective ? fromPerspective.object.payload.creatorId : undefined;
    this.authorRemote = fromPerspective ? fromPerspective.object.payload.remote : undefined;
    this.loadingCreator = false;

    await this.checkCanExecute();
    await this.checkExecuted();

    /** the proposal creator is set at proposal creation */
    this.canRemove = await this.evees.client.canUpdate(this.proposalId);

    this.loading = false;
  }

  async checkIsOwner() {}

  async checkExecuted() {
    /* a proposal is considered accepted if all the updates are now ancestors of their target */
    const isAncestorVector = await Promise.all(
      this.proposal.object.mutation.updates.map((update) => {
        return this.evees.isAncestorCommit(
          this.evees.client,
          update.perspectiveId,
          update.newHeadId,
          update.oldHeadId
        );
      })
    );

    this.executed = !isAncestorVector.includes(false);
  }

  async checkCanExecute() {
    /* check the update list, if user canUpdate on all the target perspectives,
    the user can execute the proposal */
    const canExecuteVector = await Promise.all(
      this.proposal.object.mutation.updates.map(
        async (update): Promise<boolean> => {
          return this.evees.client.canUpdate(update.perspectiveId);
        }
      )
    );

    this.canExecute = !canExecuteVector.includes(false);
  }

  async showProposalChanges() {
    const client = new ClientOnMemory(
      this.evees.client,
      this.evees.client.store,
      this.proposal.object.mutation
    );

    this.showDiff = true;
    const options: MenuConfig = {};

    if (this.canExecute && !this.executed) {
      options['accept'] = {
        disabled: false,
        text: 'accept',
        icon: 'done',
      };
    }

    options['close'] = {
      disabled: false,
      text: 'close',
      icon: 'clear',
    };

    if (this.canExecute || this.canRemove) {
      options['delete'] = {
        disabled: false,
        text: 'delete',
        icon: 'delete',
        background: '#c93131',
      };
    }

    await this.updateComplete;

    this.eveesDiffEl.client = client;
    this.updatesDialogEl.options = options;

    const value = await new Promise((resolve) => {
      this.updatesDialogEl.resolved = (value) => {
        this.showDiff = false;
        resolve(value);
      };
    });

    this.dispatchEvent(new CustomEvent('dialogue-closed', { bubbles: true, composed: true }));
    this.showDiff = false;

    if (value === 'accept') {
      /** run the proposal changes as the logged user */
      await client.flush();
      await this.evees.client.update({ deletedPerspectives: [this.proposalId] });

      this.load();

      this.dispatchEvent(
        new ContentUpdatedEvent({
          detail: { uref: this.proposal.object.toPerspectiveId },
          bubbles: true,
          composed: true,
        })
      );
    }

    if (value === 'delete') {
      await this.evees.client.update({ deletedPerspectives: [this.proposalId] });
      this.load();
    }
  }

  renderDiff() {
    return html`
      <uprtcl-dialog id="updates-dialog">
        <evees-update-diff id="evees-update-diff"> </evees-update-diff>
      </uprtcl-dialog>
    `;
  }

  renderDefault() {
    return html`
      <div @click=${() => this.showProposalChanges()} class="row-container">
        <div class="proposal-name">
          ${this.authorId !== undefined
            ? html`
                <evees-author
                  user-id=${this.authorId}
                  remote-id=${this.authorRemote as string}
                  show-name
                ></evees-author>
              `
            : 'unknown'}
        </div>
        <div class="proposal-state">
          ${this.loading
            ? html` <uprtcl-loading></uprtcl-loading> `
            : this.canExecute
            ? html`
                <uprtcl-icon-button
                  icon=${this.executed ? 'done' : 'call_merge'}
                  ?disabled=${this.executed}
                ></uprtcl-icon-button>
              `
            : ''}
        </div>
      </div>
      ${this.showDiff ? this.renderDiff() : ''}
    `;
  }

  render() {
    if (this.loadingCreator) {
      return html` <div class=""><uprtcl-loading></uprtcl-loading></div> `;
    }

    let renderDefault = true;
    let lense: any = undefined;
    if (this.toRemote && this.toRemote.proposal !== undefined) {
      renderDefault = false;
      lense = this.toRemote.proposal as any;
    }

    return renderDefault ? this.renderDefault() : lense().render({ proposalId: this.proposalId });
  }

  static get styles() {
    return css`
      :host {
        width: 100%;
      }
      .row-container {
        height: 100%;
        display: flex;
        flex-direction: row;
      }
      .proposal-name {
        height: 100%;
        flex-grow: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .proposal-state {
        width: 140px;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .proposal-state uprtcl-button {
        margin: 0 auto;
      }
    `;
  }
}

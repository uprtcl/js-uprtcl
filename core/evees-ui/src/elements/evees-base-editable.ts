import { css, html, internalProperty, property } from 'lit-element';

import { icons } from '@uprtcl/common-ui';
import { ClientRemote, ConnectionLoggedEvents, Logger } from '@uprtcl/evees';

import { EveesBaseElement } from './evees-base';

export enum EditableCase {
  IS_OFFICIAL_DONT_HAVE_DRAFT = 'IS_OFFICIAL_DONT_HAVE_DRAFT',
  IS_OFFICIAL_HAS_DRAFT = 'IS_OFFICIAL_HAS_DRAFT',
  IS_DRAFT_HAS_OFFICIAL = 'IS_DRAFT_HAS_OFFICIAL',
  IS_DRAFT_DONT_HAVE_OFFICIAL = 'IS_DRAFT_DONT_HAVE_OFFICIAL',
}

/** A base component for evees with one official perspective and one draft per user */
export class EveesBaseEditable<T extends object> extends EveesBaseElement<T> {
  logger = new Logger('EVEES-INFO-Draft');

  @property({ type: String, attribute: 'first-uref' })
  firstRef!: string;

  @internalProperty()
  isLoggedEdit = false;

  @internalProperty()
  hasPull: boolean = false;

  @internalProperty()
  protected case: EditableCase = EditableCase.IS_OFFICIAL_DONT_HAVE_DRAFT;

  protected mineId: string | undefined = undefined;
  protected editRemote!: ClientRemote;

  async firstUpdated() {
    this.uref = this.firstRef;
    this.remote = this.evees.remotes[0];
    this.editRemote = this.evees.remotes.length > 1 ? this.evees.remotes[1] : this.evees.remotes[0];

    await this.checkLoggedOnEdit();

    if (this.editRemote.events) {
      this.editRemote.events.on(ConnectionLoggedEvents.logged_status_changed, () =>
        this.checkLoggedOnEdit()
      );
    }

    await super.firstUpdated();

    if (this.remote.events) {
      this.remote.events.on(ConnectionLoggedEvents.logged_out, () => this.seeOfficial());
      this.remote.events.on(ConnectionLoggedEvents.logged_status_changed, () => this.load());
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('firstRef') && changedProperties.get('firstRef')) {
      this.uref = this.firstRef;
      this.load();
    }
  }

  async checkLoggedOnEdit() {
    this.isLoggedEdit = await this.editRemote.isLogged();
  }

  async load() {
    await super.load();

    if (!this.editRemote.explore) {
      throw new Error('explore is undefined');
    }

    const { perspectiveIds: drafts } = await this.editRemote.explore({
      under: { elements: [{ id: this.firstRef }] },
      forks: { independent: true },
    });

    this.mineId = drafts.length > 0 ? drafts[0] : undefined;
    this.logger.log('BaseDraft -- load() set mineId', this.mineId);

    this.checkCase();

    await this.checkPull();
  }

  async loadData() {
    await super.load();
  }

  isDraft() {
    return (
      this.case === EditableCase.IS_DRAFT_DONT_HAVE_OFFICIAL ||
      this.case === EditableCase.IS_DRAFT_HAS_OFFICIAL
    );
  }

  checkCase() {
    const current = this.case;
    const hasOfficial = this.firstRef !== this.mineId;
    const hasDraft = this.mineId !== undefined;
    const isDraft = this.mineId === this.uref;

    if (!isDraft) {
      if (hasDraft) {
        this.case = EditableCase.IS_OFFICIAL_HAS_DRAFT;
      } else {
        this.case = EditableCase.IS_OFFICIAL_DONT_HAVE_DRAFT;
      }
    } else {
      if (hasOfficial) {
        this.case = EditableCase.IS_DRAFT_HAS_OFFICIAL;
      } else {
        this.case = EditableCase.IS_DRAFT_DONT_HAVE_OFFICIAL;
      }
    }

    // hook for subclasses to react to case change
    this.caseUpdated ? this.caseUpdated(current) : null;
  }

  caseUpdated?(oldCase: EditableCase);

  async checkPull(recurse: boolean = true) {
    this.hasPull = false;

    if (this.case === EditableCase.IS_DRAFT_HAS_OFFICIAL) {
      const config = {
        forceOwner: true,
        recurse,
      };

      // Create a temporary workspaces to compute the merge
      this.eveesPull = this.evees.clone('pull-client');
      const merger = new RecursiveContextMergeStrategy(this.eveesPull);
      await merger.mergePerspectivesExternal(this.mineId as string, this.firstRef, config);

      const diff = await this.eveesPull.client.diff();
      this.hasPull = diff.updates.length > 0;
    }
  }

  async pullChanges() {
    await this.eveesPull.flush();
    await this.checkPull();
  }

  async checkoutDraft(recurse: boolean = true) {
    if (this.mineId) {
      return this.seeDraft();
    } else {
      return this.createDraft(recurse);
    }
  }

  async toggleDraft() {
    if (!this.isDraft()) {
      this.checkoutDraft();
    } else {
      this.seeOfficial();
    }
  }

  async createDraft(recurse: boolean = true): Promise<void> {
    this.mineId = await this.evees.forkPerspective(this.firstRef, this.editRemote.id, undefined, {
      recurse,
      detach: false,
    });
    await this.evees.flush();
    this.logger.log('BaseDraft -- createDraft()', this.mineId);
    return this.seeDraft();
  }

  async seeDraft(): Promise<void> {
    this.logger.log('seeDraft -- seeDraft()', this.mineId);
    if (!this.mineId) throw new Error(`mineId not defined`);
    this.uref = this.mineId;
    return this.loadData();
  }

  async seeOfficial(): Promise<void> {
    this.logger.log('BaseDraft -- seeOfficial()', this.mineId);
    this.uref = this.firstRef;
    return this.loadData();
  }

  renderInfo() {
    if (!this.isLogged || !this.isLoggedEdit) return '';

    let text = '';
    let textColor = '';
    let circleColor = '';
    let circleText: string | undefined = undefined;
    let clickable = true;

    switch (this.case) {
      case EditableCase.IS_OFFICIAL_DONT_HAVE_DRAFT:
        text = 'edit';
        textColor = ' gray-color';
        circleColor = ' grey-background';
        break;

      case EditableCase.IS_OFFICIAL_HAS_DRAFT:
        text = 'see draft';
        textColor = ' blue-color';
        circleColor = ' grey-background';
        break;

      case EditableCase.IS_DRAFT_HAS_OFFICIAL:
        text = 'editing';
        textColor = ' blue-color';
        circleColor = ' blue-background';
        break;

      case EditableCase.IS_DRAFT_DONT_HAVE_OFFICIAL:
        clickable = false;
        text = '';
        textColor = '';
        circleColor = ' blue-background';
        circleText = 'new';
        break;
    }

    return html` <div
      @click=${() => this.toggleDraft()}
      class=${'edit-control-container' + (clickable ? ' clickable' : '')}
    >
      <div class="left-control">
        ${this.hasPull
          ? html`<uprtcl-button @click=${() => this.pullChanges()}>pull</uprtcl-button>`
          : ''}
      </div>
      <div class="right-control">
        <div class=${'action-text' + textColor}>${text}</div>
        <div class=${'action-circle' + circleColor}>
          ${circleText !== undefined ? circleText : icons.edit}
        </div>
      </div>
    </div>`;
  }

  static get styles() {
    return [
      css`
        .edit-control-container {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 0.7rem;
          margin: 1rem 0rem;
        }
        .left-control {
          flex: 1 0 auto;
          display: flex;
          align-items: center;
          justify-content: flex-start;
        }
        .right-control {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
        }
        .action-text {
          margin-right: 6px;
          font-size: 13px;
          user-select: none;
        }
        .action-circle {
          height: 32px;
          width: 32px;
          border-radius: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          font-size: 11px;
          font-weight: bold;
          color: white;
        }
        .action-circle svg {
          height: 20px;
          width: 20px;
          fill: white;
        }
        .grey-color {
          color: var(--gray-dark, gray);
        }
        .blue-color {
          color: var(--primary, blue);
        }
        .grey-background {
          background-color: var(--gray-dark, gray);
        }
        .blue-background {
          background-color: var(--primary, blue);
        }
        .clickable {
          cursor: pointer;
        }
      `,
    ];
  }
}

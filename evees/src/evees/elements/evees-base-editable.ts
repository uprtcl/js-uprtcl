import { icons } from '@uprtcl/common-ui';
import { css, html, internalProperty, property } from 'lit-element';

import { Logger } from '../../utils/logger';
import { RemoteEvees } from '../interfaces/remote.evees';
import { RemoteLoggedEvents } from '../interfaces/remote.logged';
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
  protected case: EditableCase = EditableCase.IS_OFFICIAL_DONT_HAVE_DRAFT;

  protected mineId: string | undefined = undefined;
  protected editRemote!: RemoteEvees;

  async firstUpdated() {
    this.uref = this.firstRef;
    this.remote = this.evees.remotes[0];
    this.editRemote = this.evees.remotes.length > 1 ? this.evees.remotes[1] : this.evees.remotes[0];
    this.checkLoggedEdit();

    if (this.editRemote.events) {
      this.editRemote.events.on(RemoteLoggedEvents.logged_status_changed, () =>
        this.checkLoggedEdit()
      );
    }

    await super.firstUpdated();

    if (this.remote.events) {
      this.remote.events.on(RemoteLoggedEvents.logged_out, () => this.seeOfficial());
      this.remote.events.on(RemoteLoggedEvents.logged_status_changed, () => this.load());
    }
  }

  updated(changedProperties) {
    if (changedProperties.has('firstRef') && changedProperties.get('firstRef')) {
      this.uref = this.firstRef;
      this.load();
    }
  }

  async checkLoggedEdit() {
    this.isLoggedEdit = await this.editRemote.isLogged();
  }

  async load() {
    await super.load();

    /** it's assumed that there is only one fork per user on the remote  */
    const drafts = await this.editRemote.searchEngine.forks(this.firstRef);
    this.mineId = drafts.length > 0 ? drafts[0] : undefined;
    this.logger.log('BaseDraft -- load() set mineId', this.mineId);

    this.checkCase();
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

    // neale subclasses to react to case change
    this.caseUpdated ? this.caseUpdated(current) : null;
  }

  caseUpdated?(oldCase: EditableCase);

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
    this.mineId = await this.evees.forkPerspective(
      this.firstRef,
      this.editRemote.id,
      undefined,
      recurse
    );
    await this.evees.client.flush();
    this.logger.log('BaseDraft -- createDraft()', this.mineId);
    return this.seeDraft();
  }

  async seeDraft(): Promise<void> {
    this.logger.log('seeDraft -- seeDraft()', this.mineId);
    if (!this.mineId) throw new Error(`mineId not defined`);
    this.uref = this.mineId;
    return this.load();
  }

  async seeOfficial(): Promise<void> {
    this.logger.log('BaseDraft -- seeOfficial()', this.mineId);
    this.uref = this.firstRef;
    return this.load();
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
        text = 'see original';
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

    return html`<div
      @click=${() => this.toggleDraft()}
      class=${'edit-control-container' + (clickable ? ' clickable' : '')}
    >
      <div class=${'action-text' + textColor}>${text}</div>
      <div class=${'action-circle' + circleColor}>
        ${circleText !== undefined ? circleText : icons.edit}
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
          color: var(--gray, gray);
        }
        .blue-color {
          color: var(--primary, blue);
        }
        .grey-background {
          background-color: var(--gray, gray);
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

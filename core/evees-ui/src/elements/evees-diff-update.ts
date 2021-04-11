import { LitElement, property, html, css, internalProperty } from 'lit-element';

import { Logger } from '../../../evees/src/utils/logger';
import { servicesConnect } from '../container/multi-connect.mixin';

import { Evees } from '../../../evees/src/evees/evees.service';
import { UpdateDetails } from '../../../evees/src/evees/interfaces/types';
import { LinkingBehaviorNames } from 'src/patterns/behaviours/has-links';
import { arrayDiff } from '../../../evees/src/evees/merge/utils';
import { icons } from '@uprtcl/common-ui';

const LOGINFO = false;

export class EveesDiffUpdate extends servicesConnect(LitElement) {
  logger = new Logger('EVEES-DIFF-UPDATE');

  @internalProperty()
  loading = true;

  @internalProperty()
  removedChildren!: string[];

  @internalProperty()
  addedChildren!: string[];

  @internalProperty()
  path!: string;

  updateDetails!: UpdateDetails;

  /** the evees service can be set from a parent component*/
  localEvees!: Evees;

  async firstUpdated() {
    this.logger.log('firstUpdated()');
    this.load();
  }

  async load() {
    if (!this.localEvees) {
      this.localEvees = this.evees;
    }

    this.loading = true;

    const oldChildren = this.updateDetails.oldData
      ? this.localEvees.behaviorConcat(
          this.updateDetails.oldData.object,
          LinkingBehaviorNames.CHILDREN
        )
      : [];

    const newChildren = this.localEvees.behaviorConcat(
      this.updateDetails.newData.object,
      LinkingBehaviorNames.CHILDREN
    );

    const { added, removed } = arrayDiff(oldChildren, newChildren);

    this.removedChildren = removed;
    this.addedChildren = added;

    const titles = await Promise.all(
      this.updateDetails.path.map((id) => this.localEvees.perspectiveBehaviorFirst(id, 'title'))
    );
    this.path = '/' + titles.join('/');

    this.loading = false;
  }

  renderTopDiff() {
    const lenses = this.evees.behaviorFirst(this.updateDetails.newData.object, 'diffLenses');
    return html`
      ${lenses[0].render(
        this.localEvees,
        this.updateDetails.newData.object,
        this.updateDetails.oldData ? this.updateDetails.oldData.object : undefined
      )}
    `;
  }

  renderChildChange(id: string, isAdd: boolean) {
    return html`
      <evees-diff-row type=${isAdd ? 'add' : 'remove'}
        ><uprtcl-entity
          uref=${id}
          .localEvees=${this.localEvees}
          read-only
          class=${'entity ' + (isAdd ? 'green' : 'red') + '-background'}
        >
        </uprtcl-entity
      ></evees-diff-row>
    `;
  }

  render() {
    if (this.loading) {
      return html` <uprtcl-loading></uprtcl-loading> `;
    }

    return html` <div class="on-row">on ${this.path}</div>
      ${this.renderTopDiff()}
      ${this.addedChildren.length > 0
        ? html` ${this.addedChildren.map((childId) => this.renderChildChange(childId, true))} `
        : ''}
      ${this.removedChildren.length > 0
        ? html`
              ${this.removedChildren.map((childId) => this.renderChildChange(childId, false))}
            </div>
          `
        : ''}`;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        text-align: left;
      }
      .on-row {
        font-size: 0.85rem;
      }
      .entity {
        display: block;
        border-radius: 3px;
      }
      .green-background {
        background-color: #abdaab;
      }
      .red-background {
        background-color: #dab6ab;
      }
    `;
  }
}

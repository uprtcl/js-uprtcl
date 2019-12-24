import { Dictionary } from 'lodash';
import { LitElement, property, html, css } from 'lit-element';

import { reduxConnect } from '@uprtcl/micro-orchestrator';
import { Hashed } from '@uprtcl/cortex';
import { Secured, selectById } from '@uprtcl/common';

import { Commit, Perspective, EveesTypes, PerspectiveDetails } from '../types';
import { Evees } from '../services/evees';
import { selectPerspectiveHeadId, selectEvees } from '../state/evees.selectors';

export class Evee extends reduxConnect(LitElement) {
  
  @property({ type: Object })
  perspective!: Secured<Perspective>;

  @property({ attribute: false })
  commit!: Commit;

  firstUpdated() {
    this.initialLoad();
  }

  async initialLoad() {
    const state = this.store.getState();
    const headId = selectPerspectiveHeadId(this.perspective.id)(selectEvees(state));
    if (headId === undefined) return;
    this.commit = selectById(headId)(state) as Commit;
  }

  render() {
    return html`
      <div>
        <div class="evee-info">
        </div>
        <cortex-entitiy .hash=${this.commit.dataId}></cortex-entitiy>
      </div>
    `;
  }

  static get styles() {
    return css`
      .column {
        display: flex;
        flex-direction: column;
      }

      .row {
        display: flex;
        flex-direction: row;
      }
    `;
  }
}

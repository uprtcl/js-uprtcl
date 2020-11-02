import { LitElement, html, css, property } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesModule, EveesRemote } from '@uprtcl/evees';
import { HttpEthAuthProvider } from '@uprtcl/http-provider';

import { Router } from '@vaadin/router';

export class Doc extends moduleConnect(LitElement) {
  @property({ attribute: false })
  docId!: string;

  @property({ attribute: false })
  defaultRemote!: string;

  @property({ attribute: false })
  loading: boolean = true;

  async firstUpdated() {
    this.loading = true;
    this.docId = window.location.pathname.split('/')[2];
    this.loading = false;
  }

  goHome() {
    Router.go(`/home`);
  }

  render() {
    if (this.docId === undefined) return '';
    if (this.loading)
      return html`
        <uprtcl-loading></uprtcl-loading>
      `;

    return html`
      <wiki-drawer show-proposals @back=${() => this.goHome()} uref=${this.docId}></wiki-drawer>
    `;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
    }

    wiki-drawer {
      flex-grow: 1;
    }
  `;
}

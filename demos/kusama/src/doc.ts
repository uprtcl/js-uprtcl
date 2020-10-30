import { LitElement, html, css, property } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesConfig, EveesModule, EveesRemote } from '@uprtcl/evees';

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

    const defaultRemote = (this.requestAll(EveesModule.bindings.Config) as EveesConfig)
      .defaultRemote;

    await defaultRemote.connect();
    this.defaultRemote = defaultRemote.id;
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
      <wiki-drawer
        @back=${() => this.goHome()}
        uref=${this.docId}
        default-remote=${this.defaultRemote}
        .editableRemotes=${[this.defaultRemote]}
      ></wiki-drawer>
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

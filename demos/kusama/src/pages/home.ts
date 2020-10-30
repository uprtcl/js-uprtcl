import { LitElement, html, css, internalProperty } from 'lit-element';
import { moduleConnect } from '@uprtcl/micro-orchestrator';
import { EveesModule, EveesRemote } from '@uprtcl/evees';
import { Router } from '@vaadin/router';

export class Home extends moduleConnect(LitElement) {
  @internalProperty()
  isLogged: boolean = false;

  defaultRemote!: EveesRemote;

  async firstUpdated() {
    this.defaultRemote = (this.request(EveesModule.bindings.Config) as any).defaultRemote;
    await this.defaultRemote.ready();
    this.load();
  }

  async load() {
    this.isLogged = await this.defaultRemote.isLogged();
  }

  async onAccountSpaceClick() {
    Router.go(`/account`);
  }

  async onCouncilSpaceClick() {
    Router.go(`/council`);
  }

  async login() {
    await this.defaultRemote.login();
    this.load();
  }

  render() {
    return html`
      <a @click=${this.onCouncilSpaceClick} href="/council">
        <uprtcl-button>Council Space</uprtcl-button>
      </a>
      ${this.isLogged
        ? html`
            <a @click=${this.onAccountSpaceClick}>
              <uprtcl-button>Your Space</uprtcl-button>
            </a>
          `
        : html`
            <uprtcl-button @click=${() => this.login()}>login</uprtcl-button>
          `}
    `;
  }

  static styles = css`
    :host {
      flex-grow: 1;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      text-align: center;
      height: 80vh;
      padding: 10vh 10px;
    }
    a {
      text-decoration: none;
    }
    uprtcl-button {
      margin-bottom: 24px;
      width: 200px;
    }
  `;
}

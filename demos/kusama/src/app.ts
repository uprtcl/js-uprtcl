import { LitElement, html, query, css } from 'lit-element';
import { router, routes } from './router';

import { sharedStyles } from './styles';

export class App extends LitElement {
  @query('#outlet')
  outlet: HTMLElement;

  async firstUpdated() {
    router.setOutlet(this.outlet);
    router.setRoutes(routes);
  }

  render() {
    return html`
      <div id="outlet"></div>
    `;
  }

  static get styles() {
    return [
      sharedStyles,
      css`
        :host {
          height: 100vh;
          flex-direction: column;
          display: flex;
          justify-content: center;
        }

        #outlet {
          height: 100%;
          display: flex;
          flex-direction: column;
          overflow: auto;
        }

        layout {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
        }
      `
    ];
  }
}

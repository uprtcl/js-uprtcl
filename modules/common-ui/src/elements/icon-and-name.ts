import { LitElement, html, css, property } from 'lit-element';

export class UprtclIconAndName extends LitElement {
  @property({ type: String, attribute: 'name' })
  name!: string;

  @property({ type: String, attribute: 'icon-src' })
  iconSource!: string;

  @property({ type: Boolean, attribute: 'show-name' })
  showName = false;

  render() {
    return html`
      <div class="icon-container">
        <slot>
          ${this.iconSource
            ? html`<img class="avatar-image" src=${this.iconSource} />`
            : html`<div class="icon-placeholder"></div>`}
        </slot>
      </div>
      ${this.showName
        ? html`<div class="name-container">${this.name ? this.name : 'Smute'}</div>`
        : ''}
    `;
  }

  static get styles() {
    return [
      css`
        :host {
          display: flex;
          align-items: center;
        }
        .icon-container {
          margin: 5px;
          overflow: hidden;
          width: 40px;
          height: 40px;
          border-radius: var(--border-radius-complete);

        }
        .icon-placeholder {
          background-color: #cccccc;
          height: 100%;
        }
        .name-container {
          color: #636668;
          font-weight: bold;
          white-space: nowrap;
        }
      `,
    ];
  }
}

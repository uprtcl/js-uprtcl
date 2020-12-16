import { LitElement, html, css, property } from 'lit-element';
import { icons } from './icons';

export class UprtclListItem extends LitElement {
  @property({ type: Boolean })
  selected: boolean = false;

  @property({ type: Boolean })
  hasMeta: boolean = false;

  @property({ type: String })
  icon!: string;

  render() {
    let classes = ['container'];
    if (this.selected) classes.push('selected');

    return html`
      <div class=${classes.join(' ')}>
        <div class="vertically-centered">
          ${this.icon
            ? html` <div class="icon-container">${icons[this.icon]}</div> `
            : ''}
          <div class="main-item"><slot></slot></div>
          ${this.hasMeta
            ? html` <div class="meta-item"><slot name="meta"></slot></div> `
            : ''}
        </div>
      </div>
    `;
  }

  static get styles() {
    return [
      css`
        :host {
          display: block;
        }
        .container:hover {
          background: #f1f1f1;
        }
        .selected {
          border-color: var(--selected-border-color, #2196f3);
          border-left-style: solid;
          border-right-style: solid;
          border-width: 3px;
        }
        .container {
          flex: 1 1 0px;
          overflow: hidden;
          display: flex;
          height: 48px;
          flex-direction: column;
          justify-content: center;
          cursor: pointer;
          transition: background-color 200ms linear;
          padding: var(--padding, 0px 12px);
        }
        .vertically-centered {
          display: flex;
          flex-direction: row;
        }
        .main-item {
          flex: 1 1 0px;
          overflow: hidden;
          display: flex;
          flex-direction: row;
          margin-left: 6px;
          vertical-align: middle;
          line-height: 24px;
        }
        .meta-item {
          flex: 0 0 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .icon-container {
          height: 24px;
        }
        .icon-container svg {
          fill: #717377;
        }
      `,
    ];
  }
}

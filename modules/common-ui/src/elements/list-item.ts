import { LitElement, html, css, property } from 'lit-element';

export class UprtclListItem extends LitElement {
  @property({ type: Boolean })
  selected: boolean = false;

  @property({ type: Boolean })
  hasMeta: boolean = false;

  render() {
    let classes = ['container'];
    if (this.selected) classes.push('selected');

    return html`
      <div class=${classes.join(' ')}>
        <div class="vertically-centered">
          <div class="main-item"><slot></slot></div>
          ${this.hasMeta
            ? html`
                <div class="meta-item"><slot name="meta"></slot></div>
              `
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
          flex-grow: 1;
        }
        .main-item {
          flex: 1 1 0;
        }
        .meta-item {
          flex: 0 0 0;
        }
      `
    ];
  }
}

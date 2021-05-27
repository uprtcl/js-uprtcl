import { html, css, state, property } from 'lit-element';

import { MenuOption, MenuOptions, styles } from '@uprtcl/common-ui';
import { EveesBaseElement } from '@uprtcl/evees-ui';
import { TextNode } from '@uprtcl/documents';
import { SELECT_PAGE_EVENT_NAME } from './wiki.editable';
import { REMOVE_PAGE_EVENT_NAME } from './page-list-editable';

export class PageItemElement extends EveesBaseElement<TextNode> {
  @property({ type: Boolean })
  selected: boolean = false;

  @internalProperty()
  title: string = '';

  async dataUpdated() {
    this.title = this.data ? this.evees.behaviorFirst(this.data.object, 'title') : undefined;
  }

  selectPage() {
    this.dispatchEvent(
      new CustomEvent(SELECT_PAGE_EVENT_NAME, {
        bubbles: true,
        composed: true,
        detail: { uref: this.uref },
      })
    );
  }

  async optionOnPage(e) {
    switch (e.detail.key) {
      case 'remove':
        this.dispatchEvent(
          new CustomEvent(REMOVE_PAGE_EVENT_NAME, {
            bubbles: true,
            composed: true,
            detail: { uref: this.uref },
          })
        );
        break;
    }
  }

  render() {
    const menuConfig: MenuOptions = new Map();

    menuConfig.set('remove', {
      disabled: false,
      text: 'remove',
      icon: 'delete',
    });

    let classes: string[] = [];

    classes.push('page-item-row clickable');
    if (this.selected) {
      classes.push('selected-item');
    }
    const titleStr = this.title ? this.title : 'Untitled';

    return html`
      <div class=${classes.join(' ')} @click=${() => this.selectPage()}>
        <span class="text-container">${titleStr}</span>

        <span class="item-menu-container">
          <uprtcl-options-menu
            class="options-menu"
            @option-click=${this.optionOnPage}
            .config=${menuConfig}
            skinny
            secondary
          >
          </uprtcl-options-menu>
        </span>
      </div>
    `;
  }
  static get styles() {
    return [
      styles,
      css`
        :host {
          cursor: pointer;
        }
        .page-item-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 0.1rem 0.2rem;
          padding-left: 2.2rem;
          transition: background 0.1s ease-in-out;
        }
        .page-item-row:hover {
          background: #0001;
        }
        .item-icon-container svg {
          height: 12px;
          margin-right: 6px;
        }
        .text-container {
          flex: 1;
        }
      `,
    ];
  }
}

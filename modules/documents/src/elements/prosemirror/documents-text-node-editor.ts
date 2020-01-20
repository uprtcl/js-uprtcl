import { LitElement, html, css, property } from 'lit-element';

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { toggleMark } from 'prosemirror-commands';

import { styles } from './prosemirror.css';
import { titleSetup } from './setup';
import { titleSchema } from './schema-title';
import { blockSchema } from './schema-block';

import { iconsStyle } from './icons.css';
import { icons } from './icons';

export class DocumentTextNodeEditor extends LitElement {
  editor: any = {};

  @property({ type: String })
  type!: string;

  @property({ type: String })
  placeholder: string | undefined = undefined;

  @property({ type: Boolean, attribute: false })
  showMenu: Boolean = false;

  @property({ type: Boolean, attribute: false })
  selected: Boolean = false;

  @property({ type: Boolean, attribute: false })
  showUrl: Boolean = false;

  @property({ type: Boolean, attribute: false })
  empty: Boolean = false;

  preventHide: Boolean = false;
  content: any | undefined = undefined;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('blur', () => {
      setTimeout(() => {
        this.selected = false;
      }, 200);
    });

    this.addEventListener('keypress', e => {
      const key = e.which || e.keyCode;
      // 13 is enter
      if (key === 13) {
        e.preventDefault();
        e.stopPropagation();

        if (this.showUrl) {
          this.linkConfirmed();
        }
      }

      // 27 is esc
      if (key === 27) {
        e.preventDefault();
        e.stopPropagation();

        this.preventHide = false;
        this.showUrl = false;
        this.showMenu = false;
      }
    });
  }

  firstUpdated() {
    this.editor.schema = this.type === 'title' ? titleSchema : blockSchema;

    this.editor.state = EditorState.create({
      schema: this.editor.schema,
      plugins: titleSetup({ schema: this.editor.schema })
    });

    if (this.shadowRoot == null) return;
    const container = this.shadowRoot.getElementById('editor-content');
    
    this.editor.view = new EditorView(container, {
      state: this.editor.state,
      dispatchTransaction: (transaction: any) => {
        if (!transaction.curSelection.empty) {
          this.selected = true;
        } else {
          this.selected = false;
        }
        let newState = this.editor.view.state.apply(transaction);
        this.editor.view.updateState(newState);
        this.content = newState.doc.content;
        this.chechIsEmpty();
      }
    });
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('showUrl') && this.showUrl && this.shadowRoot != null) {
      const input = this.shadowRoot.getElementById('URL_INPUT');
      if (input) {
        input.focus();
      }
    }

    if (changedProperties.has('selected')) {
      if (!this.selected) {
        if (!this.preventHide) {
          this.showMenu = false;
        }
      } else {
        this.showMenu = true;
      }
    }
  }

  getIsEmpty() {
    if (this.content === undefined) return true;
    if (this.content.length > 1) return false;
    if (this.content.content[0].content.content[0].content.content.length === 0) return true;
    return false;
  }

  chechIsEmpty() {
    this.empty = this.getIsEmpty();
  }

  linkClick() {
    this.preventHide = true;
    this.showUrl = !this.showUrl;
  }

  linkCancelled() {
    this.preventHide = false;
    this.showUrl = false;
    this.showMenu = false;
  }

  linkConfirmed() {
    if (this.shadowRoot == null) return;

    let href = (this.shadowRoot.getElementById('URL_INPUT') as HTMLInputElement).value;

    if (!href.startsWith('http')) {
      href = `http://${href}`;
    }

    let valid = true;
    try {
      new URL(href);
    } catch (_) {
      valid = false;
      console.log('Invalid url');
    }
    if (valid) {
      toggleMark(this.editor.schema.marks.link, { href })(
        this.editor.view.state,
        this.editor.view.dispatch
      );
      this.preventHide = false;
      this.showUrl = false;
      this.selected = false;
    }
  }

  menuItemClick(markType: any) {
    this.preventHide = false;
    toggleMark(markType)(this.editor.view.state, this.editor.view.dispatch);
  }

  render() {
    return html`
      ${this.showMenu
        ? html`
            <div class="top-menu">
              <!-- icons from https://material.io/resources/icons/?icon=format_bold&style=round  -->
              ${this.type !== 'title'
                ? html`
                    <div
                      class="btn btn-large"
                      @click=${() => this.menuItemClick(this.editor.schema.marks.strong)}
                    >
                      ${icons.bold}
                    </div>
                  `
                : ''}
              <div
                class="btn btn-large"
                @click=${() => this.menuItemClick(this.editor.schema.marks.em)}
              >
                ${icons.em}
              </div>
              <div class="btn btn-small" @click=${this.linkClick}>
                ${icons.link}
              </div>
              ${this.showUrl
                ? html`
                    <div class="inp">
                      <input placeholder="url" id="URL_INPUT" />
                      <div @click=${this.linkCancelled} class="btn btn-small">
                        ${icons.cross}
                      </div>
                      <div @click=${this.linkConfirmed} class="btn btn-small">
                        ${icons.check}
                      </div>
                    </div>
                  `
                : ''}
            </div>
          `
        : ''}
      <div id="editor-content" class="editor-content">
        ${this.empty
          ? html`
              ${this.placeholder ? this.placeholder : ''}
            `
          : ''}
      </div>
    `;
  }

  static get styles() {
    return [
      styles,
      iconsStyle,
      css`
        [contenteditable]:empty:before {
          content: attr(placeholder);
          display: block;
        }
        :host {
          position: relative;
          width: 100%;
        }
        .top-menu {
          position: absolute;
          display: flex;
          padding: 0px 0px;
          height: 40px;
          top: -50px;
          left: 25px;
          background-color: white;
          border-radius: 10px;
          border: solid 1px #cfcfcf;
          box-shadow: 3px 3px 2px 0px rgba(201, 201, 201, 1);
          background-color: #28282a;
        }
        .btn {
          width: 40px;
          cursor: pointer;
          border-radius: 8px;
          text-align: center;
          fill: white;
        }
        .btn:hover {
          background-color: #444444;
          transition: background-color 100ms linear;
        }
        .btn-large svg {
          margin-top: 6px;
          width: 30px;
          height: 30px;
        }
        .btn-small svg {
          margin-top: 8px;
          width: 26px;
          height: 26px;
        }
        .inp {
          display: flex;
        }
        .inp input {
          height: 40px;
          font-size: 14px;
          padding-left: 12px;
          border: none;
          background-color: #444444;
          color: white;
        }
        .editor-content {
          margin: 0px 0px;
        }
      `
    ];
  }
}

import { LitElement, html, css, property } from 'lit-element';

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { toggleMark } from 'prosemirror-commands';
import { DOMParser, DOMSerializer } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';

import { styles } from './prosemirror.css';
import { titleSchema } from './schema-title';
import { blockSchema } from './schema-block';

import { iconsStyle } from './icons.css';
import { icons } from './icons';
import { TextType } from '../../types';

export class DocumentTextNodeEditor extends LitElement {
  editor: any = {};

  @property({ type: String })
  type!: string;

  @property({ type: String })
  init!: string;

  @property({ type: String })
  editable: string = 'true';

  @property({ type: Number })
  level: number = 0;

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

        if (this.showUrl) {
          this.linkConfirmed();
        }
      }

      // 27 is esc
      if (key === 27) {
        e.preventDefault();

        this.preventHide = false;
        this.showUrl = false;
        this.showMenu = false;
      }
    });
  }

  onEnter() {
    this.dispatchEvent(new CustomEvent('enter-pressed'));
    return true;
  }

  firstUpdated() {
    this.editor.schema = this.type === TextType.Title ? titleSchema : blockSchema;

    /** convert HTML string to doc state */
    let htmlString = this.init.trim();

    /** sorry, we work with HTML... */
    if (!htmlString.startsWith('<')) {
      if (this.type === TextType.Title) {
        htmlString = `<h1>${htmlString}</h1>`;
      } else {
        htmlString = `<p>${htmlString}</p>`;
      }
    }

    let temp = document.createElement('template');
    temp.innerHTML = htmlString;
    const element = temp.content.firstChild;

    this.editor.parser = DOMParser.fromSchema(this.editor.schema);
    this.editor.serializer = DOMSerializer.fromSchema(this.editor.schema);

    const doc = this.editor.parser.parse(element);

    /** the heading level for render is given by the `level` attribute,
     * not the heading tag (which is always <h1> in the data text) */
    if (doc.content.content[0].type.name === 'heading') {
      doc.content.content[0].attrs.level = this.level;
    }

    this.editor.state = EditorState.create({
      schema: this.editor.schema,
      doc: doc,
      plugins: [keymap({ Enter: (state, dispatch) => this.onEnter() })]
    });

    if (this.shadowRoot == null) return;
    const container = this.shadowRoot.getElementById('editor-content');

    this.editor.view = new EditorView(container, {
      state: this.editor.state,
      editable: () => this.editable === 'true',
      dispatchTransaction: transaction => this.handleTransaction(transaction)
    });
  }

  handleTransaction(transaction: any) {
    if (!transaction.curSelection.empty) {
      this.selected = true;
    } else {
      this.selected = false;
    }

    let newState = this.editor.view.state.apply(transaction);

    let contentChanged = !newState.doc.eq(this.editor.view.state.doc);

    this.editor.view.updateState(newState);
    if (!contentChanged) return;

    /** doc changed */

    /** make sure heading is <h1> */
    if (newState.doc.content.content[0].type.name === 'heading') {
      newState.doc.content.content[0].attrs.level = 1;
    }

    const fragment = this.editor.serializer.serializeFragment(newState.doc);
    const temp = document.createElement('div');
    temp.appendChild(fragment);

    this.dispatchEvent(
      new CustomEvent('content-changed', {
        detail: {
          content: temp.innerHTML
        }
      })
    );
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

  typeClick() {
    const newType = this.type === TextType.Title ? TextType.Paragraph : TextType.Title;
    this.dispatchEvent(
      new CustomEvent('change-type', {
        detail: {
          type: newType
        }
      })
    );
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
              <div class="btn btn-text" @click=${this.typeClick}>
                ${this.type === TextType.Title ? 'text' : 'Title'}
              </div>
              ${this.type !== TextType.Title
                ? html`
                    <div
                      class="btn btn-square btn-large"
                      @click=${() => this.menuItemClick(this.editor.schema.marks.strong)}
                    >
                      ${icons.bold}
                    </div>
                  `
                : ''}
              <div
                class="btn btn-square btn-large"
                @click=${() => this.menuItemClick(this.editor.schema.marks.em)}
              >
                ${icons.em}
              </div>
              <div class="btn btn-square btn-small" @click=${this.linkClick}>
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
        :host {
          position: relative;
          width: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, 'Apple Color Emoji',
            Arial, sans-serif, 'Segoe UI Emoji', 'Segoe UI Symbol';
        }

        a {
          color: inherit;
        }

        .top-menu {
          z-index: 10;
          position: absolute;
          display: flex;
          padding: 0px 0px;
          height: 40px;
          top: -50px;
          left: 25px;
          background-color: white;
          border-radius: 10px;
          border: solid 1px #cfcfcf;
          background-color: #28282a;
        }

        .btn {
          cursor: pointer;
          border-radius: 8px;
          text-align: center;
          fill: white;
          color: white;
        }

        .btn:hover {
          background-color: #444444;
          transition: background-color 100ms linear;
        }

        .btn-text {
          color: white;
          padding: 12px 16px;
          font-weight: bold;
        }

        .btn-square {
          width: 40px;
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

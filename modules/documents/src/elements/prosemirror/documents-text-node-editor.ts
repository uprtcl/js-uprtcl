import { LitElement, html, css, property } from 'lit-element';

import { Logger } from '@uprtcl/micro-orchestrator';

import { EditorState, TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { toggleMark, splitBlock, joinBackward } from 'prosemirror-commands';
import { DOMParser, DOMSerializer } from 'prosemirror-model';

import { styles } from './prosemirror.css';
import { titleSchema } from './schema-title';
import { blockSchema } from './schema-block';

import { iconsStyle } from './icons.css';
import { icons } from './icons';
import { TextType } from '../../types';
import { runInThisContext } from 'vm';

export const APPEND_ACTION = 'append';
export const FOCUS_ACTION = 'focus';

const LOGINFO = false;

export class DocumentTextNodeEditor extends LitElement {
  logger = new Logger('DOCUMENT-TEXT-NODE-EDITOR');

  @property({ type: String })
  type!: TextType;

  @property({ type: String })
  init!: string;

  @property({ type: String, attribute: 'to-append' })
  toAppend!: string;

  @property({ type: String })
  editable: string = 'true';

  @property({ type: String, attribute: 'toggle-action' })
  toggleAction: string = 'true';

  @property({ type: Object })
  action: any = {};

  @property({ type: String, attribute: 'focus-init' })
  focusInit: string = 'false';

  @property({ type: Number })
  level: number = 0;

  @property({ type: Boolean, attribute: false })
  showMenu: Boolean = false;

  @property({ type: Boolean, attribute: false })
  selected: Boolean = false;

  @property({ type: Boolean, attribute: false })
  showUrl: Boolean = false;

  @property({ type: Boolean, attribute: false })
  empty: Boolean = false;

  editor: any = {};
  preventHide: Boolean = false;
  currentContent: string | undefined = undefined;

  connectedCallback() {
    super.connectedCallback();

    this.addEventListener('blur', () => {
      setTimeout(() => {
        this.selected = false;
      }, 200);
    });
  }

  firstUpdated() {
    this.initEditor();
  }

  updated(changedProperties: Map<string, any>) {
    if (LOGINFO) this.logger.log('updated()', { changedProperties });

    if (changedProperties.has('toggleAction')) {
      if (changedProperties.get('toggleAction') !== undefined) {
        this.runAction(this.action);
      }
    }

    if (changedProperties.has('focusInit')) {
      if (this.focusInit === 'true') {
        this.editor.view.focus();
      }
    }

    if (changedProperties.has('toAppend')) {
      if (
        changedProperties.get('toAppend') === undefined ||
        changedProperties.get('toAppend') === 'undefined'
      ) {
        if (this.toAppend !== 'undefined') {
          this.appendContent(this.toAppend);
          this.dispatchEvent(new CustomEvent('content-appended'));
        }
      }
    }

    if (changedProperties.has('editable') || changedProperties.has('type')) {
      // if (LOGINFO) this.logger.info('updated() - editable || type', {editable: this.editable, type: this.type, changedProperties});
      this.initEditor();
    }

    if (changedProperties.has('init')) {
      if (this.init !== this.currentContent) {
        this.initEditor();
        return;
      }
    }

    if (changedProperties.has('showUrl') && this.showUrl && this.shadowRoot != null) {
      const input = this.shadowRoot.getElementById('URL_INPUT');
      if (input) {
        input.focus();
      }
    }

    if (changedProperties.has('selected')) {
      if (!this.selected) {
        if (!this.preventHide) {
          this.setShowMenu(false);
        }
      } else {
        this.setShowMenu(true);
      }
    }
  }

  runAction(action: any) {
    if (LOGINFO) this.logger.log('runAction()', { action });
    switch (action.name) {
      case APPEND_ACTION:
        this.appendContent(action.pars.content);
        break;

      case FOCUS_ACTION:
        if (LOGINFO) this.logger.log('focusing()');
        this.editor.view.focus();
        break;

      default:
        throw new Error(`unexpected action ${action.name}`);
    }
  }

  getValidInnerHTML(text: string) {
    if (text.startsWith('<h1') || text.startsWith('<p')) {
      const temp = document.createElement('template');
      temp.innerHTML = text.trim();
      if (temp.content.firstElementChild == null) {
        return '';
      }
      return temp.content.firstElementChild.innerHTML;
    } else {
      return text;
    }
  }

  getValidDocHtml(text: string) {
    const innerHTML = this.getValidInnerHTML(text);
    let tag = this.type === TextType.Title ? 'h1' : 'p';
    return `<${tag}>${innerHTML}</${tag}>`;
  }

  getSlice(text: string) {
    const htmlString = this.getValidDocHtml(text);
    if (!htmlString) return undefined;

    let temp = document.createElement('template');
    temp.innerHTML = htmlString;

    return temp.content.firstChild;
  }

  appendContent(content: string) {
    if (LOGINFO) this.logger.log('appending content', content);

    const sliceNode = this.getSlice(content);
    const slice = this.editor.parser.parseSlice(sliceNode);

    const end = this.editor.view.state.doc.content.content[0].nodeSize;

    this.editor.view.dispatch(this.editor.view.state.tr.replace(end - 1, end, slice));

    this.editor.view.dispatch(
      this.editor.view.state.tr.setSelection(
        TextSelection.near(this.editor.view.state.doc.resolve(end - 1))
      )
    );

    this.editor.view.focus();
  }

  keydown(view, event) {
    if (LOGINFO) this.logger.log('keydown()', { keyCode: event.keyCode });

    /** enter */
    if (event.keyCode === 13) {
      event.preventDefault();

      /** simulate splitBlock */
      const splitTr = view.state.tr.split(view.state.selection.$cursor.pos);

      /** applied just to get the second part, the actual transaction
       * is applied in dispatch */
      const newState = view.state.apply(splitTr);
      const secondPart = newState.doc.content.content[1];

      view.dispatch(splitTr.delete(view.state.selection.$cursor.pos, view.state.doc.nodeSize));

      /** send event to parent */
      const fragment = this.editor.serializer.serializeFragment(secondPart);
      const temp = document.createElement('div');
      temp.appendChild(fragment);
      const content = temp.innerHTML;

      if (LOGINFO) this.logger.log('enter-pressed', { content });
      this.dispatchEvent(
        new CustomEvent('enter-pressed', {
          detail: {
            content,
            asChild: this.type === TextType.Title,
          },
        })
      );

      return;
    }

    // 27 is esc
    if (event.keyCode === 27) {
      if (this.showMenu) {
        event.preventDefault();
        this.preventHide = false;
        this.showUrl = false;
        this.setShowMenu(false);
      }
    }

    /** backspace */
    if (event.keyCode === 8) {
      if (view.state.selection.$cursor.pos === 1) {
        event.preventDefault();

        const content = this.state2Html(view.state);
        if (LOGINFO) this.logger.log('backspace-on-start', { content });
        this.dispatchEvent(
          new CustomEvent('backspace-on-start', {
            bubbles: true,
            composed: true,
            detail: {
              content,
            },
          })
        );
      }
      return;
    }

    /** delete */
    if (event.keyCode === 46) {
      if (view.state.selection.$cursor.pos >= view.state.doc.content.content[0].nodeSize - 1) {
        event.preventDefault();

        const content = this.state2Html(view.state);
        if (LOGINFO) this.logger.log('backspace-on-start', { content });
        this.dispatchEvent(new CustomEvent('delete-on-end'));
      }
      return;
    }

    /** arrow up */
    if (event.keyCode === 38) {
      if (view.state.selection.$cursor.pos === 1) {
        event.preventDefault();
        if (LOGINFO) this.logger.log('dispatching keyup-on-start');
        this.dispatchEvent(new CustomEvent('keyup-on-start'));
        return;
      }
    }

    /** arrow down */
    if (event.keyCode === 40) {
      if (view.state.selection.$cursor.pos >= view.state.doc.content.content[0].nodeSize - 1) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('keydown-on-end'));
        return;
      }
    }

    /** (B)old */
    /** backspace */
    if (event.keyCode === 66) {
      if (event.ctrlKey === true) {
        event.preventDefault();
        toggleMark(this.editor.view.state.schema.marks.strong)(
          this.editor.view.state,
          this.editor.view.dispatch
        );
      }
      return;
    }

    if (event.keyCode === 74) {
      if (event.ctrlKey === true) {
        event.preventDefault();
        toggleMark(this.editor.view.state.schema.marks.em)(
          this.editor.view.state,
          this.editor.view.dispatch
        );
      }
      return;
    }

    if (event.keyCode === 75) {
      if (event.ctrlKey === true) {
        event.preventDefault();
        this.linkClick();
      }
      return;
    }
  }

  isEditable() {
    if (LOGINFO) this.logger.log(`isEditable()`, { editable: this.editable });
    const editable = this.editable !== undefined ? this.editable === 'true' : false;
    return editable;
  }

  initEditor() {
    if (this.editor && this.editor.view) {
      this.editor.view.destroy();
      this.editor = {};
      if (LOGINFO) this.logger.log(`initEditor() - Initializing editor`, { init: this.init });
    }

    const schema = this.type === TextType.Title ? titleSchema : blockSchema;
    this.editor.parser = DOMParser.fromSchema(schema);
    this.editor.serializer = DOMSerializer.fromSchema(schema);

    this.currentContent = this.init;
    const doc = this.html2doc(this.getValidDocHtml(this.init));

    /** the heading level for render is given by the `level` attribute,
     * not the heading tag (which is always <h1> in the data text) */
    if (doc.content.content[0].type.name === 'heading') {
      doc.content.content[0].attrs.level = this.level;
    }

    const state = EditorState.create({
      schema: schema,
      doc: doc,
      plugins: [],
    });

    if (this.shadowRoot == null) return;
    const container = this.shadowRoot.getElementById('editor-content');

    this.editor.view = new EditorView(container as Node, {
      state: state,
      editable: () => this.isEditable(),
      dispatchTransaction: (transaction) => this.dispatchTransaction(transaction),
      handleDOMEvents: {
        focus: () =>
          this.dispatchEvent(
            new CustomEvent('focus-changed', {
              bubbles: true,
              composed: true,
              detail: { value: true },
            })
          ),
        blur: () =>
          this.dispatchEvent(
            new CustomEvent('focus-changed', {
              bubbles: true,
              composed: true,
              detail: { value: false },
            })
          ),
        keydown: (view, event) => {
          this.keydown(view, event);
          return true;
        },
      },
    });

    if (this.focusInit === 'true') {
      this.editor.view.focus();
    }
  }

  state2Html(state) {
    const fragment = this.editor.serializer.serializeFragment(state.doc);
    const temp = document.createElement('div');
    temp.appendChild(fragment);
    return (temp.firstElementChild as HTMLElement).innerHTML;
  }

  html2doc(text: string) {
    /** convert HTML string to doc state */
    let temp = document.createElement('template');
    temp.innerHTML = text;
    const element = temp.content.firstChild;

    return this.editor.parser.parse(element);
  }

  dispatchTransaction(transaction: any) {
    if (!transaction.curSelection.empty) {
      this.selected = true;
    } else {
      this.selected = false;
    }

    const content = this.state2Html(this.editor.view.state);
    let newState = this.editor.view.state.apply(transaction);

    let contentChanged = !newState.doc.eq(this.editor.view.state.doc);
    this.editor.view.updateState(newState);

    if (LOGINFO)
      this.logger.log('dispatchTransaction()', {
        selected: this.selected,
        newState,
        contentChanged,
        transaction,
      });

    if (!contentChanged) return;

    /** doc changed */

    const newContent = this.state2Html(newState);

    if (LOGINFO)
      this.logger.log(`dispatchTransaction() - content-changed`, { content, newContent });

    /** local copy of the html (withot the external tag) represeting the current state */
    this.currentContent = newContent;

    this.dispatchEvent(
      new CustomEvent('content-changed', {
        detail: {
          content: newContent,
        },
      })
    );
  }

  toHeading(lift: boolean) {
    this.changeType(TextType.Title, lift);
  }

  toParagraph() {
    this.changeType(TextType.Paragraph, false);
  }

  reduceHeading() {
    this.dispatchEvent(new CustomEvent('lift-heading', {}));
  }

  changeType(type: TextType, lift: boolean) {
    this.dispatchEvent(
      new CustomEvent('change-type', {
        detail: { type, lift },
      })
    );
  }

  urlKeydown(event) {
    // 27 is esc
    if (event.keyCode === 27) {
      if (this.showMenu) {
        event.preventDefault();
        this.linkCancelled();
      }
    }

    // 13 is enter
    if (event.keyCode === 13) {
      if (this.showMenu) {
        event.preventDefault();
        this.linkConfirmed();
      }
    }
  }

  async setShowMenu(value: boolean) {
    if (!this.shadowRoot) return;

    if (this.editable !== 'true') {
      this.showMenu = false;
      return;
    }

    this.showMenu = value;
    this.requestUpdate();

    if (value === true) {
      await this.updateComplete;

      const menu = this.shadowRoot.getElementById('TOP_MENU');
      if (!menu) return;

      /** listen events */
      menu.addEventListener('keydown', (event) => {
        if (event.keyCode === 27) {
          // 27 is esc
          event.stopPropagation();
          this.setShowMenu(false);
        }
      });
    } else {
      if (this.preventHide) {
        this.editor.view.focus();
      }
    }
  }

  linkClick() {
    this.preventHide = true;
    this.showUrl = !this.showUrl;
  }

  linkCancelled() {
    this.preventHide = false;
    this.showUrl = false;
    this.setShowMenu(false);
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
      toggleMark(this.editor.view.state.schema.marks.link, { href })(
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

  editorFocused() {
    if (LOGINFO) this.logger.log('editor focused');
  }

  editorBlured() {
    if (LOGINFO) this.logger.log('editor blured');
  }

  renderUrlMenu() {
    return html`
      <div class="inp">
        <input @keydown=${this.urlKeydown} placeholder="url" id="URL_INPUT" />
        <button @click=${this.linkCancelled} class="btn btn-small">
          ${icons.cross}
        </button>
        <button @click=${this.linkConfirmed} class="btn btn-small">
          ${icons.check}
        </button>
      </div>
    `;
  }

  renderParagraphItems() {
    return html`
      ${this.level > 2
        ? html`
            <button class="btn btn-text" @click=${() => this.toHeading(true)}>
              <span>h${this.level - 1}</span>
            </button>
          `
        : ''}
      <button class="btn btn-text" @click=${() => this.toHeading(false)}>
        <span>h${this.level}</span>
      </button>
    `;
  }

  renderHeadingItems() {
    return this.level > 1
      ? html`
          ${this.level > 2
            ? html`
                <button class="btn btn-text" @click=${() => this.reduceHeading()}>
                  <span>h${this.level - 1}</span>
                </button>
              `
            : ''}
          <button class="btn btn-text" @click=${this.toParagraph}>
            <span>text</span>
          </button>
        `
      : '';
  }

  renderLevelControllers() {
    return html`
      <!-- current level -->
      <button class="btn-text btn-current">
        <span>${this.type === TextType.Title ? `h${this.level}` : 'text'}</span>
      </button>

      <!-- level controllers -->
      ${this.type === TextType.Paragraph ? this.renderParagraphItems() : this.renderHeadingItems()}
    `;
  }

  renderMenu() {
    return html`
      <div class="top-menu" id="TOP_MENU">
        <!-- icons from https://material.io/resources/icons/?icon=format_bold&style=round  -->

        ${this.renderLevelControllers()}
        ${this.type !== TextType.Title
          ? html`
              <button
                class="btn btn-square btn-large"
                @click=${() => this.menuItemClick(this.editor.view.state.schema.marks.strong)}
              >
                ${icons.bold}
              </button>
            `
          : ''}
        <button
          class="btn btn-square btn-large"
          @click=${() => this.menuItemClick(this.editor.view.state.schema.marks.em)}
        >
          ${icons.em}
        </button>

        <button class="btn btn-square btn-small" @click=${this.linkClick}>
          ${icons.link}
        </button>

        ${this.showUrl ? this.renderUrlMenu() : ''}
      </div>
    `;
  }

  render() {
    if (LOGINFO) this.logger.log('render()', { this: this });
    return html`
      ${this.showMenu ? this.renderMenu() : ''}
      <div id="editor-content" class="editor-content"></div>
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

        .top-menu button {
          font-family: inherit;
          font-size: 100%;
          line-height: 1.15;
          margin: 0;
          overflow: visible;
          text-transform: none;
          background-color: transparent;
          border: 0px;
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

        .btn-current {
          text-decoration: underline;
          color: #9292a5;
          user-select: none;
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
          height: 38px;
          font-size: 14px;
          padding-left: 12px;
          border: none;
          background-color: #444444;
          color: white;
        }

        .editor-content {
          margin: 0px 0px;
        }
      `,
    ];
  }
}

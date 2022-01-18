import { Logger } from '@uprtcl/evees';
import { css, html, LitElement, property, state } from 'lit-element';

import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema, DOMParser, DOMSerializer } from 'prosemirror-model';
import { schema } from 'prosemirror-schema-basic';
import { addListNodes } from 'prosemirror-schema-list';
import { exampleSetup } from 'prosemirror-example-setup';

const LOGINFO = false;

export class PageEditor extends LitElement {
  logger = new Logger('DOCUMENT-TEXT-NODE-EDITOR');

  @property({ type: String })
  editable = 'true';

  @state()
  editorId!: string;

  init!: string;
  schema!: any;
  editor: any = {};
  preventHide: Boolean = false;
  currentContent: string | undefined = undefined;

  connectedCallback() {
    super.connectedCallback();
    this.editorId = `page-editor-${Math.floor(Math.random() * 1000000)}`;
    document.addEventListener('click', this.handleEditorClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleEditorClick);
  }

  handleEditorClick = (event) => {
    const ix = event.composedPath().findIndex((el: any) => el.id === this.editorId);
    if (ix === -1) {
      this.dispatchEvent(new CustomEvent('clicked-outside'));
    }
  };

  firstUpdated() {
    this.initEditor();
  }

  updated(changedProperties: Map<string, any>) {
    if (LOGINFO) this.logger.log('updated()', { changedProperties });

    if (changedProperties.has('editable')) {
      // if (LOGINFO) this.logger.info('updated() - editable || type', {editable: this.editable, type: this.type, changedProperties});
      this.initEditor();
    }

    if (changedProperties.has('init')) {
      if (this.init !== this.currentContent) {
        this.initEditor();
        return;
      }
    }
  }

  initEditor() {
    if (this.editor && this.editor.view) {
      this.editor.view.destroy();
      this.editor = {};
      if (LOGINFO)
        this.logger.log('initEditor() - Initializing editor', {
          init: this.init,
        });
    }

    this.schema = new Schema({
      nodes: addListNodes(schema.spec.nodes, 'paragraph block*', 'block'),
      marks: schema.spec.marks,
    });

    this.editor.parser = DOMParser.fromSchema(this.schema);
    this.editor.serializer = DOMSerializer.fromSchema(this.schema);

    this.currentContent = this.init;

    const state = EditorState.create({
      doc: this.editor.parser.fromSchema(this.schema).parse(''),
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
        blur: () => {
          this.dispatchEvent(
            new CustomEvent('focus-changed', {
              bubbles: true,
              composed: true,
              detail: { value: false },
            })
          );
          return true;
        },
        keydown: (view, event) => {
          this.keydown(view, event);
          return true;
        },
        dblclick: (view, event) => {
          this.setShowMenu(true);
          return true;
        },
        drop: (view, event) => {
          event.preventDefault();
          return false;
        },
      },
      nodeViews: {
        code_block: (node, view, getPos) =>
          new CodeBlockView(node, view, getPos, () => this.enterPressedEvent('', false)),
      },
    });

    if (this.focusInit === 'true') {
      this.editor.view.focus();
    }
  }

  state2Html(state: EditorState) {
    const fragment = this.editor.serializer.serializeFragment(state.doc);

    const node = state.doc.content.child(0);
    const temp = document.createElement('div');
    temp.appendChild(fragment);
    /** heading and paragraph content are stored without the exernal tag */
    if (node.type.name === 'code_block') {
      return (temp as HTMLElement).innerHTML;
    } else {
      return (temp.firstElementChild as HTMLElement).innerHTML;
    }
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
      this.setShowMenu(true);
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
      this.logger.log('dispatchTransaction() - content-changed', {
        content,
        newContent,
      });

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
        this.subMenuCancel();
      }
    }

    // 13 is enter
    if (event.keyCode === 13) {
      if (this.showMenu) {
        event.preventDefault();
        this.subMenuConfirm();
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

  subMenuClick(type: ActiveSubMenu) {
    if (this.activeSubMenu !== type) {
      this.activeSubMenu = type;
      this.preventHide = true;
      this.showUrlMenu = true;

      if (
        this.activeSubMenu === ActiveSubMenu.IMAGE ||
        this.activeSubMenu === ActiveSubMenu.VIDEO
      ) {
        this.showDimMenu = true;
      } else {
        this.showDimMenu = false;
      }
    } else {
      this.resetSubMenu();
    }
  }

  private resetSubMenu() {
    this.preventHide = false;
    this.activeSubMenu = null;
    this.showDimMenu = false;
    this.showUrlMenu = false;
  }

  subMenuConfirm() {
    switch (this.activeSubMenu) {
      case ActiveSubMenu.LINK:
        this.applyLinkMark();
        break;
      case ActiveSubMenu.IMAGE:
        this.applyImageNode();
        break;
      case ActiveSubMenu.VIDEO:
        this.applyIframeNode();
        break;
    }

    this.resetSubMenu();
  }

  subMenuCancel() {
    this.resetSubMenu();
    this.setShowMenu(false);
  }

  private isValidLink(link: string) {
    if (!link.startsWith('http')) {
      link = `http://${link}`;
    }
    try {
      new URL(link);
    } catch (_) {
      return false;
    }

    return link;
  }

  getSubMenuFields() {
    if (this.shadowRoot == null) return { link: '', width: '', height: '' };

    return {
      link: (this.shadowRoot.getElementById('URL_INPUT') as HTMLInputElement).value,
      width: this.shadowRoot.getElementById('DIM_WIDTH')
        ? (this.shadowRoot.getElementById('DIM_WIDTH') as HTMLInputElement).value
        : '',
      height: this.shadowRoot.getElementById('DIM_HEIGHT')
        ? (this.shadowRoot.getElementById('DIM_HEIGHT') as HTMLInputElement).value
        : '',
    };
  }

  applyLinkMark() {
    const { link } = this.getSubMenuFields();

    const href = this.isValidLink(link);
    if (href) {
      toggleMark(this.editor.view.state.schema.marks.link, { href })(
        this.editor.view.state,
        this.editor.view.dispatch
      );
      this.preventHide = false;
      this.selected = false;
    }
  }

  alignNodeToCenter() {
    setBlockType(this.editor.view.state.schema.nodes.paragraph, {
      style: 'text-align:center',
    })(this.editor.view.state, this.editor.view.dispatch);
  }

  applyImageNode() {
    const { link, width, height } = this.getSubMenuFields();
    if (this.isValidLink(link)) {
      const node = this.editor.view.state.doc.content.content[0];
      const end = node.nodeSize;
      const imgNode = this.editor.view.state.schema.nodes.image.create({
        src: link,
        style: `${width !== '' ? `width:${width}px` : ''};${
          height !== '' ? `height:${height}px` : ''
        };max-width: 100%;margin: 0 auto;border-radius: 5px;`,
      });
      this.dispatchTransaction(this.editor.view.state.tr.replaceSelectionWith(imgNode, false));
      this.alignNodeToCenter();
      // this.editor.view.dispatch();
    }
  }

  parseYoutubeURL(url: string) {
    const getParameterByName = (name, url) => {
      name = name.replace(/[\[\]]/g, '\\$&');
      let regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, ' '));
    };

    let embedUrl = 'https://www.youtube.com/embed';

    // For when the user copies the youtube video URL
    // on the address bar
    if (url.indexOf('?v=') > -1) {
      const videoId = getParameterByName('v', url);
      embedUrl += `/${videoId}`;
      // For when the user right-clicks on the video and
      // copies the "video url"
    } else if (url.indexOf('youtu.be') > -1) {
      embedUrl += `/${url.split('/').pop()}`;

      // If none of these patterns match, do not parse
      // the given URL by the user.
    } else {
      return url;
    }

    return embedUrl;
  }

  applyIframeNode() {
    const { link, width, height } = this.getSubMenuFields();
    if (this.isValidLink(link)) {
      const iframeNode = this.editor.view.state.schema.nodes.iframe.create({
        src: this.parseYoutubeURL(link),
        style: `width:${
          width !== '' ? width + 'px' : '100%'
        };height:52vw;border:0px;max-width:100%;max-height:470px;`,
      });

      this.dispatchTransaction(this.editor.view.state.tr.replaceSelectionWith(iframeNode, false));
      this.alignNodeToCenter();
    }
  }

  menuItemClick(markType: any) {
    this.preventHide = false;
    toggleMark(markType)(this.editor.view.state, this.editor.view.dispatch);
    this.resetSubMenu();
  }

  convertTo(type: string, event: Event) {
    event.stopImmediatePropagation();
    this.setShowMenu(false);
    this.dispatchEvent(
      new CustomEvent('convert-to', {
        detail: {
          type,
        },
        bubbles: true,
        composed: true,
      })
    );
  }

  editorFocused() {
    if (LOGINFO) this.logger.log('editor focused');
  }

  editorBlured() {
    if (LOGINFO) this.logger.log('editor blured');
  }

  renderDimensionsMenu() {
    // incase we want the height field back
    // const renderHeightDim = () => html`
    //   <input @keydown=${this.urlKeydown} class="dim" placeholder="height" id="DIM_HEIGHT" />px
    // `;
    return html`
      <input
        @keydown=${this.urlKeydown}
        class="dim"
        placeholder="width (optional)"
        id="DIM_WIDTH"
      />
    `;
  }

  renderUrlMenu() {
    return html`
      <div class="inp">
        <div class="inp-hldr">
          <input
            @keydown=${this.urlKeydown}
            placeholder="${this.activeSubMenu !== ActiveSubMenu.LINK
              ? this.activeSubMenu + ' '
              : ''}url"
            id="URL_INPUT"
          />
          ${this.showDimMenu ? this.renderDimensionsMenu() : ''}
        </div>
        <div class="inp-actions">
          <button @click=${this.subMenuCancel} class="btn btn-small">${icons.cross}</button>
          <button @click=${this.subMenuConfirm} class="btn btn-small">${icons.check}</button>
        </div>
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
      <!-- level controllers -->
      ${this.type === TextType.Paragraph ? this.renderParagraphItems() : this.renderHeadingItems()}
    `;
  }

  /**
   * Menus that needs to show up only when there is a `selection`
   */

  renderSelectionOnlyMenus(type: string) {
    const menus = html`
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

      <button
        class="btn btn-square btn-small"
        @click=${() => this.subMenuClick(ActiveSubMenu.LINK)}
      >
        ${icons.link}
      </button>
    `;
    return this.hasSelection() && type !== 'code' ? menus : '';
  }

  hasSelection() {
    if (this.editor.view.state.selection.from > 1 || this.editor.view.state.selection.to > 1) {
      return true;
    }
    return false;
  }

  toggleCode() {
    const node = this.editor.view.state.doc.content.content[0];
    const end = node.nodeSize;
    const newType =
      node.type.name !== 'code_block' ? blockSchema.nodes.code_block : blockSchema.nodes.paragraph;

    this.editor.view.dispatch(this.editor.view.state.tr.setBlockType(0, end, newType));
  }

  renderConvertMenu() {
    return html`<uprtcl-popper position="bottom-left">
      <button slot="icon" class="btn">TextNode</button>
      <uprtcl-list>
        ${this.canConvertTo.map(
          (to) =>
            html`<uprtcl-list-item @click=${(e) => this.convertTo(to, e)}>${to}</uprtcl-list-item>`
        )}
      </uprtcl-list>
    </uprtcl-popper>`;
  }

  renderMenu() {
    const embedSubMenu = html`
      <button
        class="btn btn-square btn-small"
        @click=${() => this.subMenuClick(ActiveSubMenu.IMAGE)}
      >
        ${icons.image}
      </button>

      <button
        class="btn btn-square btn-small"
        @click=${() => this.subMenuClick(ActiveSubMenu.VIDEO)}
      >
        ${icons.youtube}
      </button>
    `;
    const codeSubMenu = html`
      <button class="btn btn-square btn-small" @click=${this.toggleCode}>${icons.code}</button>
    `;

    const type = this.getBlockType();
    return html`
      <div class="top-menu" id="TOP_MENU">
        <!-- icons from https://material.io/resources/icons/?icon=format_bold&style=round  -->

        <div class="menus">
          ${this.renderConvertMenu()}
          <!-- current level -->
          <button class="btn-text btn-current">
            <span>${type}</span>
          </button>
          ${this.renderSelectionOnlyMenus(type)}
          ${this.type === 'Paragraph' && type !== 'code' ? embedSubMenu : ''}
          ${this.type !== 'Title' ? codeSubMenu : ''}
        </div>
        ${this.showUrlMenu && type !== 'code' ? this.renderUrlMenu() : ''}
      </div>
    `;
  }

  getBlockType() {
    const nodeType = (this.editor.view as EditorView).state.doc.child(0).type;

    if (nodeType && nodeType.name === 'code_block') {
      return 'code';
    }

    return this.type === TextType.Title ? `h${this.level}` : 'text';
  }

  render() {
    if (LOGINFO) this.logger.log('render()', { this: this });
    return html`
      <div id=${this.editorId}>
        ${this.showMenu ? this.renderMenu() : ''}
        <div id="editor-content" class="editor-content"></div>
      </div>
    `;
  }

  static get styles() {
    return [
      cmStyle,
      styles,
      iconsStyle,
      theme,
      css`
        :host {
          position: relative;
          width: 100%;
        }

        a {
          color: inherit;
        }

        .top-menu {
          z-index: 10;
          position: absolute;
          padding: 0px 0px;
          height: initial;
          top: -50px;
          left: 25px;
          background-color: white;
          border-radius: 10px;
          border: solid 1px #cfcfcf;
          background-color: #28282a60;
          display: flex;
          flex-direction: column;
          max-width: calc(100vw - 50px);
        }

        .top-menu .menus {
          display: flex;
          justify-content: center;
          align-items: center;
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
          padding: 0 10px 7px 10px;
        }
        .inp-actions {
          display: flex;
        }

        .inp input {
          height: 38px;
          font-size: 14px;
          padding-left: 12px;
          border: none;
          background-color: #444444;
          color: white;
          margin: 0 5px 0 0;
          border-radius: 6px;
        }

        .inp input#URL_INPUT {
          flex-grow: 1;
        }

        .inp input.dim {
          width: 100px;
          margin-left: 5px;
        }

        .inp .inp-hldr {
          display: flex;
          flex-grow: 1;
          color: white;
          align-items: center;
          margin-right: 5px;
        }

        @media (max-width: 768px) {
          .inp {
            flex-direction: column;
            overflow: auto;
          }
          .top-menu {
            max-width: 80vw;
          }
          .inp input#URL_INPUT {
            width: 50%;
          }
          .inp input.dim {
            width: 50%;
          }
          .inp-actions {
            justify-content: center;
          }
        }

        .editor-content {
          margin: 0px 0px;
        }

        .yt-embed {
          max-width: 100%;
        }

        @media (max-width: 768px) {
          .yt-embed {
            max-height: 300px;
          }
        }
      `,
    ];
  }
}

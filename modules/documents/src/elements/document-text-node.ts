import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';

import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { Hashed, Entity } from '@uprtcl/cortex';
import { Secured, RemotesConfig, EveesModule, EveesRemote, Evees } from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';
import { CREATE_COMMIT, CREATE_PERSPECTIVE, UPDATE_HEAD, Perspective } from '@uprtcl/evees';

import { TextNode, TextType } from '../types';
import { CREATE_TEXT_NODE } from '../graphql/queries';
import { DocumentsModule } from '../documents.module';
import { Source } from '@uprtcl/multiplatform';

export class DocumentTextNode extends moduleConnect(LitElement) {
  logger = new Logger('DOCUMENT-TEXT-NODE');

  @property({ type: Object })
  data: Hashed<TextNode> | undefined = undefined;

  @property({ type: Object })
  perspective: Secured<Perspective> | undefined = undefined;

  @property({ type: String })
  color: string | undefined = undefined;

  @property({ type: Number })
  level: number = 0;

  @property({ type: String, attribute: 'only-children' })
  onlyChildren: String | undefined = undefined;

  @property({ type: Boolean, attribute: false })
  editable: Boolean = false;

  currentContent: any;
  private currentHeadId: string | undefined = undefined;

  getSource(eveesAuthority: string): Source {
    const remotesConfig: RemotesConfig = this.request(EveesModule.bindings.RemotesConfig);

    const textNodeEntity: Entity[] = this.requestAll(DocumentsModule.bindings.TextNodeEntity);
    const name = textNodeEntity[0].name;

    return remotesConfig.map(eveesAuthority, name);
  }

  async firstUpdated() {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
      query: gql`
      {
        entity(id: "${this.perspective.id}") {
          id
          ... on Perspective {
            head {
              id
            }
          }
          _context {
            patterns {
              accessControl {
                canWrite
              }
            }
          }
        }
      }`
    });

    this.currentHeadId = result.data.entity.head.id;
    this.editable = result.data.entity._context.patterns.accessControl.canWrite;
  }

  async updateContent(newContent: TextNode): Promise<void> {
    if (!this.perspective) return;

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const origin = this.perspective.object.payload.origin;
    const evees: Evees = this.request(EveesModule.bindings.Evees);

    this.logger.info('updateContent() - CREATE_TEXT_NODE', { newContent });
    const result = await client.mutate({
      mutation: CREATE_TEXT_NODE,
      variables: {
        content: newContent,
        source: this.getSource(origin).source
      }
    });

    const textNodeId = result.data.createTextNode.id;

    const commitUpdate = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        parentsIds: this.currentHeadId ? [this.currentHeadId] : [],
        dataId: textNodeId,
        source: evees.getPerspectiveProvider(this.perspective.object).source
      }
    });

    const headUpdate = await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.perspective.id,
        headId: commitUpdate.data.createCommit.id
      }
    });

    return textNodeId;
  }

  getLevel() {
    return this.level !== undefined ? this.level : 0;
  }

  async createChild() {
    if (!this.data) return;
    if (!this.perspective) return;

    const origin = this.perspective.object.payload.origin;

    const eveesRemotes: EveesRemote[] = this.requestAll(EveesModule.bindings.EveesRemote);
    const remote = eveesRemotes.find(r => r.authority === origin);

    if (!remote) throw new Error(`Remote not found for authority ${origin}`);

    const newNode = {
      text: '<p>empty</p>',
      type: TextType.Paragraph,
      links: []
    };

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.mutate({
      mutation: CREATE_TEXT_NODE,
      variables: {
        content: newNode,
        source: this.getSource(origin).source
      }
    });

    const commit = await client.mutate({
      mutation: CREATE_COMMIT,
      variables: {
        dataId: result.data.createTextNode.id,
        parentsIds: [],
        source: remote.source
      }
    });

    const perspective = await client.mutate({
      mutation: CREATE_PERSPECTIVE,
      variables: {
        headId: commit.data.createCommit.id,
        authority: origin
      }
    });

    const newContent = {
      ...this.data.object,
      links: [...this.data.object.links, perspective.data.createPerspective.id]
    };

    this.data = {
      ...this.data,
      object: newContent
    };

    this.logger.info('createChild()', newContent);
    await this.updateContent(newContent);
  }

  createSibling() {
    this.logger.info('createSibling()', { dataId: this.data ? this.data.id : undefined });
    this.dispatchEvent(
      new CustomEvent('create-sibling', {
        bubbles: true,
        composed: true,
        detail: {
          dataId: this.data ? this.data.id : undefined
        }
      })
    );
  }

  enterPressed() {
    if (!this.data) return;

    this.logger.info('enterPressed()', { data: this.data });

    if (this.data.object.type === TextType.Title) {
      this.createChild();
    } else {
      this.createSibling();
    }
  }

  connectedCallback() {
    super.connectedCallback();

    console.log('[DOCUMENT-NODE] connectedCallback()', {
      data: this.data,
      onlyChildren: this.onlyChildren
    });

    this.addEventListener('create-sibling', ((e: CustomEvent) => {
      if (!this.data) return;

      this.logger.info('CATCHED EVENT: create-sibling ', { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.dataId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.createChild();
    }) as EventListener);
  }

  timeout: any = undefined;

  editorContentChanged(e) {
    if (!this.data) return;

    const newContent = {
      ...this.data.object,
      text: e.detail.content
    };

    this.data.object.text = e.detail.content;
    if (this.timeout) clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.updateContent(newContent);
    }, 2000);
  }

  changeType(e: CustomEvent) {
    if (!this.data) return;

    const newContent = {
      ...this.data.object,
      type: e.detail.type
    };

    this.updateContent(newContent);
  }

  render() {
    if (!this.data)
      return html`
        <cortex-loading-placeholder></cortex-loading-placeholder>
      `;

    let contentClasses = this.data.object.type === TextType.Paragraph ? ['paragraph'] : ['title'];
    contentClasses.push('content-editable');

    const onlyChildren = this.onlyChildren !== undefined ? this.onlyChildren : 'false';

    return html`
      <div class="row">
        ${onlyChildren !== 'true'
          ? html`
              <div class="column">
                <div class="evee-info">
                  <slot name="evee"></slot>
                </div>
                <div class="node-content">
                  <documents-text-node-editor
                    type=${this.data.object.type}
                    init=${this.data.object.text}
                    level=${this.level}
                    editable=${this.editable ? 'true' : 'false'}
                    @content-changed=${this.editorContentChanged}
                    @enter-pressed=${this.enterPressed}
                    @change-type=${this.changeType}
                  ></documents-text-node-editor>
                </div>
                <!-- <div class="plugins">
                  <slot name="plugins"></slot>
                </div> -->
              </div>
            `
          : ''}

        <div class="node-children">
          ${this.data.object.links.map(
            link => html`
              <cortex-entity
                .hash=${link}
                lens-type="evee"
                .context=${{
                  color: this.color,
                  level: this.getLevel() + 1
                }}
              ></cortex-entity>
            `
          )}
        </div>
      </div>
    `;
  }

  static get styles() {
    return css`
      .column {
        display: flex;
        flex-direction: row;
      }

      .evee-info {
      }

      .node-content {
        flex-grow: 1;
      }

      .content-editable {
        padding: 11px 8px;
      }

      .node-children {
        width: 100%;
      }
    `;
  }
}

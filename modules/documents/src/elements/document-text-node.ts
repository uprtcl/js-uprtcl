import { ApolloClient, gql } from 'apollo-boost';
import { LitElement, property, html, css } from 'lit-element';
// import { styleMap } from 'lit-html/directives/style-map';
// https://github.com/Polymer/lit-html/issues/729
export const styleMap = style => {
  return Object.entries(style).reduce((styleString, [propName, propValue]) => {
    propName = propName.replace(/([A-Z])/g, matches => `-${matches[0].toLowerCase()}`);
    return `${styleString}${propName}:${propValue};`;
  }, '');
};

import { moduleConnect, Logger, Dictionary } from '@uprtcl/micro-orchestrator';
import { Hashed, Entity, Pattern, Creatable, Signed } from '@uprtcl/cortex';
import {
  Secured,
  RemotesConfig,
  EveesModule,
  Commit,
  EveesRemote,
  Evees,
  UpdateContentEvent,
  CreateCommitArgs
} from '@uprtcl/evees';
import { ApolloClientModule } from '@uprtcl/graphql';
import { UPDATE_HEAD, CreatePerspectiveArgs, Perspective } from '@uprtcl/evees';

import { TextNode, TextType } from '../types';
import { DocumentsModule } from '../documents.module';
import { Source, DiscoveryService, DiscoveryModule } from '@uprtcl/multiplatform';
import {
  CreateSyblingEvent,
  AddSyblingsEvent,
  RemoveChildrenEvent,
  CREATE_SYBLING_TAG,
  REMOVE_CHILDREN_TAG,
  ADD_SYBLINGS_TAG
} from './events';
import { DocumentsBindings } from '../bindings';

export class DocumentTextNode extends moduleConnect(LitElement) {
  logger = new Logger('DOCUMENT-TEXT-NODE');

  @property({ type: Object })
  data: Hashed<TextNode> | undefined = undefined;

  @property({ type: Object })
  perspective: Secured<Perspective> | undefined = undefined;

  @property({ type: Array })
  genealogy: string[] = [];

  @property({ type: String })
  color: string | undefined = undefined;

  @property({ type: Number })
  level: number = 0;

  @property({ type: Number })
  index: number = 0;

  @property({ type: String, attribute: 'only-children' })
  onlyChildren: String | undefined = undefined;

  @property({ type: Boolean, attribute: false })
  editable: Boolean = false;

  @property({ type: Boolean, attribute: false })
  focused: Boolean = false;

  currentText: string | undefined = undefined;
  private currentHeadId: string | undefined = undefined;

  getSource(eveesAuthority: string): Source {
    const remotesConfig: RemotesConfig = this.request(EveesModule.bindings.RemotesConfig);

    const textNodeEntity: Entity[] = this.requestAll(DocumentsModule.bindings.TextNodeEntity);
    const name = textNodeEntity[0].name;

    return remotesConfig.map(eveesAuthority, name);
  }

  getCreatePattern(symbol) {
    const patterns: Pattern[] = this.requestAll(symbol);
    const create: Creatable<any, any> | undefined = (patterns.find(
      pattern => ((pattern as unknown) as Creatable<any, any>).create
    ) as unknown) as Creatable<any, any>;

    if (!create) throw new Error(`No creatable pattern registered for a ${patterns[0].name}`);

    return create;
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

  async updateContent(newContent: TextNode) {
    const creatable: Creatable<Partial<TextNode>, TextNode> = this.getCreatePattern(
      DocumentsBindings.TextNodeEntity
    );
    const textNode = await creatable.create()(newContent, this.getSource(origin).source);

    const dataId = textNode.id;

    this.dispatchEvent(
      new CustomEvent('update-content', {
        bubbles: true,
        composed: true,
        detail: { dataId }
      })
    );
    this.logger.info('updateContent', { newContent, dataId });
  }

  async updateContentLocal(newContent: TextNode): Promise<void> {
    if (!this.perspective) return;
    if (!this.data) return;

    /** local optimistic update */
    this.data = {
      ...this.data,
      object: newContent
    };

    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const origin = this.perspective.object.payload.origin;
    const evees: Evees = this.request(EveesModule.bindings.Evees);
    const creatable: Creatable<Partial<TextNode>, TextNode> = this.getCreatePattern(
      DocumentsBindings.TextNodeEntity
    );
    const textNode = await creatable.create()(newContent, this.getSource(origin).source);

    this.logger.info('updateContent() - CREATE_TEXT_NODE', { newContent });

    const creatableCommit: Creatable<CreateCommitArgs, Signed<Commit>> = this.getCreatePattern(
      EveesModule.bindings.CommitPattern
    );
    const commit = await creatableCommit.create()(
      {
        parentsIds: this.currentHeadId ? [this.currentHeadId] : [],
        dataId: textNode.id
      },
      evees.getPerspectiveProvider(this.perspective.object).source
    );

    const headUpdate = await client.mutate({
      mutation: UPDATE_HEAD,
      variables: {
        perspectiveId: this.perspective.id,
        headId: commit.id
      }
    });
  }

  getLevel() {
    return this.level !== undefined ? this.level : 0;
  }

  async createChild(index?: number) {
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
    const creatable: Creatable<Partial<TextNode>, TextNode> = this.getCreatePattern(
      DocumentsBindings.TextNodeEntity
    );
    const textNode = await creatable.create()(newNode, this.getSource(origin).source);

    const creatableCommit: Creatable<CreateCommitArgs, Signed<Commit>> = this.getCreatePattern(
      EveesModule.bindings.CommitPattern
    );
    const commit = await creatableCommit.create()(
      {
        parentsIds: [],
        dataId: textNode.id
      },
      remote.source
    );

    const creatablePerspective: Creatable<
      CreatePerspectiveArgs,
      Signed<Perspective>
    > = this.getCreatePattern(EveesModule.bindings.PerspectivePattern);
    const perspective = await creatablePerspective.create()(
      {
        fromDetails: {
          headId: commit.id
        }
      },
      origin
    );

    const newLink = perspective.id;

    /** by default children is added as first child */
    index = index || 0;
    let newLinks: string[] = [...this.data.object.links];
    if (index >= this.data.object.links.length) {
      newLinks.push(newLink);
    } else {
      newLinks.splice(index, 0, newLink);
    }

    const newContent = {
      ...this.data.object,
      links: newLinks
    };

    if (this.currentText) {
      newContent.text = this.currentText;
    }

    this.logger.info('createChild()', newContent);
    this.updateContentLocal(newContent);
  }

  createSibling() {
    if (!this.data) return;

    this.logger.info('createSibling()', { dataId: this.data ? this.data.id : undefined });
    this.dispatchEvent(
      new CreateSyblingEvent({
        bubbles: true,
        composed: true,
        detail: {
          startedOnElementId: this.data.id,
          index: this.index + 1
        }
      })
    );
  }

  addChildren(links: string[], index?: number) {
    if (!this.data) return;

    /** children are added to the bottom by default */
    index = index || this.data.object.links.length;
    let newLinks: string[] = [...this.data.object.links];
    if (index >= this.data.object.links.length) {
      newLinks.push(...links);
    } else {
      newLinks.splice(index, 0, ...links);
    }

    const newContent: TextNode = {
      ...this.data.object,
      links: newLinks
    };

    this.updateContentLocal(newContent);
  }

  removeChildren(fromIndex?: number, toIndex?: number) {
    if (!this.data) return;

    /** children are added to the bottom by default */
    fromIndex = fromIndex || 0;
    toIndex = toIndex || this.data.object.links.length;

    let newLinks: string[] = [...this.data.object.links];
    newLinks.splice(fromIndex, toIndex - fromIndex + 1);

    const newContent: TextNode = {
      ...this.data.object,
      links: newLinks
    };

    this.updateContentLocal(newContent);
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

    this.addEventListener(CREATE_SYBLING_TAG, ((e: CreateSyblingEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: ${CreateSyblingEvent.name}`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.createChild(e.detail.index);
    }) as EventListener);

    this.addEventListener(ADD_SYBLINGS_TAG, ((e: AddSyblingsEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: ${AddSyblingsEvent.name}`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.addChildren(e.detail.elementIds, e.detail.index);
    }) as EventListener);

    this.addEventListener(REMOVE_CHILDREN_TAG, ((e: RemoveChildrenEvent) => {
      if (!this.data) return;

      this.logger.info(`CATCHED EVENT: ${RemoveChildrenEvent.name}`, { dataId: this.data.id, e });

      // TODO: this.addEventListener listens  this.dispatchEvent ???
      if (e.detail.startedOnElementId === this.data.id) return;

      // At this point this should be the text node that is the parent of the source of the event.
      e.stopPropagation();
      this.removeChildren(e.detail.fromIndex, e.detail.toIndex);
    }) as EventListener);
  }

  timeout: any = undefined;

  async getPerspectiveDataId(perspectiveId: string): Promise<string> {
    const client: ApolloClient<any> = this.request(ApolloClientModule.bindings.Client);
    const result = await client.query({
      query: gql`
      {
        entity(id: "${perspectiveId}") {
          id
          ... on Perspective {
            head {
              id
              ... on Commit {
                data {
                  id
                }
              }
            }
          }
        }
      }`
    });

    return result.data.entity.head.data.id;
  }

  async getData(dataId: string): Promise<Hashed<TextNode> | undefined> {
    const discovery: DiscoveryService = this.request(DiscoveryModule.bindings.DiscoveryService);
    return discovery.get(dataId);
  }

  async getPerspectiveData(perspectiveId: string): Promise<Hashed<TextNode> | undefined> {
    const dataId = await this.getPerspectiveDataId(perspectiveId);
    return this.getData(dataId);
  }

  editorContentChanged(e) {
    if (!this.data) return;

    const newContent = {
      ...this.data.object,
      text: e.detail.content
    };

    this.currentText = e.detail.content;
    if (this.timeout) clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.updateContentLocal(newContent);
    }, 400);
  }

  async changeType(e: CustomEvent) {
    if (!this.data) return;

    const newType = e.detail.type;
    let newContent: TextNode;

    switch (this.data.object.type) {
      case TextType.Title:
        switch (newType) {
          /** title to title: setting the same view changes nothing */
          case TextType.Title:
            return;

          /** title to paragraph: changing the type of a title to a paragraph
           *  will move all its subelements as younger siblings of the new typed
           *  paragraph */
          case TextType.Paragraph:
            const links = this.data.object.links;

            /** remove childrent */
            newContent = {
              ...this.data.object,
              links: [],
              type: newType
            };

            this.updateContent(newContent);

            /** add as syblings */
            this.dispatchEvent(
              new AddSyblingsEvent({
                bubbles: true,
                cancelable: true,
                composed: true,
                detail: {
                  startedOnElementId: this.data.id,
                  elementIds: links,
                  index: this.index + 1
                }
              })
            );

            return;
        }

      case TextType.Paragraph:
        switch (newType) {
          case TextType.Paragraph:
            return;

          /** paragraph to title: Changing the type of a paragraph to a title
           * will move all the younger sibling contexts of the paragraph as
           * children of the new title. */
          case TextType.Title:
            let newContent: TextNode = {
              ...this.data.object,
              type: newType
            };

            /** read parent to get syblings */
            if (this.genealogy.length > 1) {
              const parentData = await this.getPerspectiveData(this.genealogy[1]);

              if (parentData !== undefined) {
                const youngerSyblings = parentData.object.links.splice(this.index + 1);

                if (youngerSyblings.length > 0) {
                  const syblingsDataPromises = youngerSyblings.map(async id => {
                    const data = await this.getPerspectiveData(id);

                    if (!data) return true;
                    if (!data.object.type) return true;
                    if (data.object.type !== TextType.Paragraph) return true;

                    /** return true if element is not a paragraph */
                    return false;
                  });

                  const syblingsData = await Promise.all(syblingsDataPromises);

                  /** return the index first non paragraph element */
                  let until = syblingsData.findIndex(e => e);

                  if (until === -1) {
                    until = youngerSyblings.length;
                  }

                  /** remove these paragraphs from parent */
                  this.dispatchEvent(
                    new RemoveChildrenEvent({
                      bubbles: true,
                      cancelable: true,
                      composed: true,
                      detail: {
                        startedOnElementId: this.data.id,
                        fromIndex: this.index + 1,
                        toIndex: this.index + 1 + until
                      }
                    })
                  );

                  const nextParagraphs = [...youngerSyblings];
                  nextParagraphs.slice(0, until);

                  /** add this paragraphs as children of this node */
                  let newLinks: string[] = [...this.data.object.links];
                  if (this.index >= this.data.object.links.length) {
                    newLinks.push(...nextParagraphs);
                  } else {
                    newLinks.splice(this.index, 0, ...nextParagraphs);
                  }

                  newContent = {
                    ...newContent,
                    links: newLinks
                  };
                }
              }
            }

            this.updateContent(newContent);

            return;
        }
    }
  }

  updated(changedProperties) {
    super.updated(changedProperties);
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
      <div
        class="row"
        style=${styleMap({ backgroundColor: this.focused ? '#f7f6f3' : 'transparent' })}
      >
        ${onlyChildren !== 'true'
          ? html`
              <div class="column">
                <div class="evee-info">
                  <slot name="evee-popper"></slot>
                </div>
                <div class="node-content">
                  <documents-text-node-editor
                    type=${this.data.object.type}
                    init=${this.data.object.text}
                    level=${this.level}
                    editable=${this.editable ? 'true' : 'false'}
                    @focus=${() => (this.focused = true)}
                    @blur=${() => (this.focused = false)}
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
            (link, ix) => html`
              <cortex-entity
                hash=${link}
                lens-type="evee"
                .context=${{
                  color: this.color,
                  level: this.getLevel() + 1,
                  index: ix,
                  genealogy: this.genealogy
                }}
              >
              </cortex-entity>
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

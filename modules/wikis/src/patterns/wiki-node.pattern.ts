import { html } from 'lit-element';
import { injectable, inject } from 'inversify';
import { Store } from 'redux';

import {
  Pattern,
  HasActions,
  PatternAction,
  Hashed,
  Hashable,
  PatternTypes,
  Creatable,
  SourceProvider,
  DiscoverableSource
} from '@uprtcl/cortex';
import { selectAccessControl, selectEntityAccessControl } from '@uprtcl/common';
import { Lens, HasLenses } from '@uprtcl/lenses';
import { ReduxTypes } from '@uprtcl/micro-orchestrator';

import { WikiNode, WikisTypes } from '../types';
import { Wikis } from '../services/wikis';

const propertyOrder = ['title', 'type', 'pages'];

@injectable()
export class WikiNodePattern
  implements Pattern, Creatable<Partial<WikiNode>, WikiNode>, HasLenses, HasActions {
  constructor(
    @inject(WikisTypes.Wikis) protected wikis: Wikis,
    @inject(PatternTypes.Core.Hashed) protected hashedPattern: Pattern & Hashable<WikiNode>,
    @inject(ReduxTypes.Store) protected store: Store
  ) {}

  recognize(object: object): boolean {
    return propertyOrder.every(p => object.hasOwnProperty(p));
  }

  create = async (node: Partial<WikiNode>, upl?: string): Promise<Hashed<WikiNode>> => {
    const pages = node && node.pages ? node.pages : [];
    const title = node && node.title ? node.title : '';
    const type = node && node.type ? node.type : 'Wiki';

    const newWikiNode = { pages, title, type };
    return this.wikis.createWikiNode(newWikiNode, upl);
  };

  getLenses = (node: WikiNode): Lens[] => {
    return [
      {
        name: 'Wiki',
        render: html`
          <basic-wiki .hash=${node}></basic-wiki>     
        `
      }
    ];
  };

  getActions = (WikiNode: WikiNode, entityId: string): PatternAction[] => {
    const state = this.store.getState();
    const writable = selectEntityAccessControl(entityId)(selectAccessControl(state));

    if (!writable) return [];
    return [
      {
        icon: 'title',
        title: 'To title',
        action: (element: HTMLElement) => {
          element.dispatchEvent(
            new CustomEvent('content-changed', {
              bubbles: true,
              composed: true,
              detail: { newContent: { ...WikiNode, type: 'Wiki' } }
            })
          );
        }
      }
    ];
  };
}

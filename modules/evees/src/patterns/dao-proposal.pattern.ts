import { html } from 'lit-element';
import { injectable } from 'inversify';

import { Lens, HasLenses } from '@uprtcl/lenses';
import { Pattern, Entity } from '@uprtcl/cortex';
import { EveesBindings } from '../bindings';

export class DAOProposalPattern extends Pattern<any> {
  recognize(entity: any) {
    return entity.type ? entity.type === 'dao-proposal' : false;
  }

  type = EveesBindings.DAOProposalType;
}

@injectable()
export class DAOProposalLenses implements HasLenses<any> {
  lenses = (node: any): Lens[] => {
    return [
      {
        name: 'evees:proposal',
        type: 'content',
        render: (entity: Entity<any>, context: any) => {
          TODO!!!;
          return html`
            <proposal-ui .data=${node} ref=${entity.id}> </proposal-ui>
          `;
        },
      },
    ];
  };
}

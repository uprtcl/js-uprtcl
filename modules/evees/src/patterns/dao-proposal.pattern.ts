import { html } from 'lit-element';
import { injectable } from 'inversify';

import { Lens, HasLenses } from '@uprtcl/lenses';
import { Pattern, Entity } from '@uprtcl/cortex';
import { DAOProposal } from '@uprtcl/access-control';

import { EveesBindings } from '../bindings';

export class DAOProposalPattern extends Pattern<DAOProposal> {
  recognize(entity: DAOProposal) {
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
          return html`
            <proposal-ui .data=${node} ref=${entity.id}> </proposal-ui>
          `;
        },
      },
    ];
  };
}

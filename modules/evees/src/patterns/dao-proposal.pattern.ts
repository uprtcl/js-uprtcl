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
  lenses = (proposal: any): Lens[] => {
    return [
      {
        name: 'evees:proposal',
        type: 'content',
        render: (proposal: DAOProposal, context: any) => {
          return html`
            <voting-widget vote-id=${proposal.id} address=${proposal.owner}>
            </voting-widget>
          `;
        },
      },
    ];
  };
}

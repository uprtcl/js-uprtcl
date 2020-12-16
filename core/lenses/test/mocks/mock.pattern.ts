import { injectable } from 'inversify';
import { html } from 'lit-element';

import { Pattern, Entity } from '@uprtcl/cortex';

import { HasLenses } from '../../src/behaviours/has-lenses';

export class MockPattern extends Pattern<any> {
  recognize(object: any) {
    return (
      typeof object === 'object' &&
      object.object &&
      object.object.test &&
      typeof object.object.test === 'string'
    );
  }

  type = 'Mock';
}

@injectable()
export class Lenses implements HasLenses<Entity<any>> {
  lenses = (entity: Entity<any>) => [
    {
      name: 'content',
      render: (context: any) =>
        html` <mock-element .content=${entity.object.test}></mock-element> `,
    },
  ];
}

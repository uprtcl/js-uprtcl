import { injectable } from 'inversify';
import { html } from 'lit-html';

import { Pattern, Entity } from '@uprtcl/cortex';

import { HasLenses } from '../../src/behaviours/has-lenses';

export class MockPattern extends Pattern<any> {
  recognize() {
    return true;
  }

  type = 'Mock';
}

@injectable()
export class Lenses implements HasLenses<Entity<any>> {
  lenses = (entity: Entity<any>) => [
    {
      name: 'content',
      render: (context: any) =>
        html`
          <mock-element .content=${entity.entity.test}></mock-element>
        `
    }
  ];
}

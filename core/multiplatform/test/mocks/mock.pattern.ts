import { Pattern, HasText, Entity } from '@uprtcl/cortex';
import { injectable } from 'inversify';

export interface MockEntity {
  test: string;
  data: string | undefined;
}

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
export class Text implements HasText<Entity<MockEntity>> {
  text = (entity: Entity<MockEntity>) => entity.object.test;
}

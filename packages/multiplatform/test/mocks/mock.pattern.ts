import { Pattern, HasText, Entity } from '@uprtcl/cortex';
import { injectable } from 'inversify';
import { HasRedirect } from '../../src/behaviours/has-redirect';

export interface MockEntity {
  test: string;
  data: string | undefined;
}

export class MockPattern extends Pattern<any> {
  recognize(object: any) {
    return (
      typeof object === 'object' &&
      object.entity &&
      object.entity.test &&
      typeof object.entity.test === 'string'
    );
  }

  type = 'Mock';
}

@injectable()
export class Text implements HasText<Entity<MockEntity>> {
  text = (entity: Entity<MockEntity>) => entity.entity.test;
}

@injectable()
export class Redirect implements HasRedirect<Entity<MockEntity>> {
  redirect = async (entity: Entity<MockEntity>) => entity.entity.data;
}

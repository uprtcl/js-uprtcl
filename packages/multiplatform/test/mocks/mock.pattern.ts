import { Pattern, HasContent, Entity } from '@uprtcl/cortex';
import { injectable } from 'inversify';

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
export class Content implements HasContent<{ test: string }> {
  content = async (pattern: Entity<{ test: string }>) => pattern.entity.test;
}

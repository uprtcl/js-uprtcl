import EntityRegistry from '../../src/entity/entity-registry';
import { Entity } from '../../src/entity/entity';
import { LinkedEntity } from '../../src/entity/linked.entity';

/**
 * Entity Registry
 */
describe('EntityRegistry', () => {
  let registry: EntityRegistry;

  beforeEach(() => {
    registry = new EntityRegistry();
  });

  it('registry.from() without any register throws', () => {
    try {
      registry.from({});
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toEqual('No entity was found for the given object');
    }
  });

  it('register the base entity', () => {
    registry.registerEntity('base', Entity);

    expect(registry.isEntity('base', {})).toBeTruthy();
    expect(registry.from({}) instanceof Entity).toBeTruthy();
    expect(registry.from({}) instanceof LinkedEntity).toBeFalsy();
  });
});

import  { PatternRegistry } from '../../src/patterns/registry/pattern.registry';
import { HashedPattern } from '../../src/patterns/patterns/hashed.pattern';

/**
 * Pattern registry test
 */
describe('Pattern registry test', () => {
  let patternRegistry: PatternRegistry;

  beforeEach(() => {
    patternRegistry = new PatternRegistry();
  });

  it('register default patterns', async () => {
    expect(patternRegistry.patternList.length).toBe(4);
  });

  it('recognize hashed default pattern', async () => {
    const object = { id: '0', object: {} };
    const pattern: HashedPattern<any> = patternRegistry.recognizeMerge(object);

    expect(pattern.validate(object)).toBeTruthy();
  });

  it("don't recognize hashed default pattern", async () => {
    const object = { object: {} };
    const pattern: HashedPattern<any> = patternRegistry.recognizeMerge(object);

    expect(pattern.hasOwnProperty('validate')).toBeFalsy();
  });

  it('get pattern from registry', async () => {
    const pattern: HashedPattern<any> = patternRegistry.getPattern('hashed');
    expect(pattern['validate']).toBeTruthy();
  });
});

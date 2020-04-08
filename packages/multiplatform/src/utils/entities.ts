import { Behaviour, PatternRecognizer, Creatable, Entity } from '@uprtcl/cortex';
import { HasRedirect } from '../behaviours/has-redirect';

/**
 * Generically create the given data and retrieve its hashed it
 *
 * @param data the data to create
 * @returns the created hashed data
 */
export const createEntity = (recognizer: PatternRecognizer) => async <T extends object>(
  data: T,
  casID: string
): Promise<string> => {
  const behaviours: Behaviour<T>[] = recognizer.recognizeBehaviours(data);

  const creatable = behaviours.find(b => !!(b as Creatable<T, any>).create);

  if (!creatable) {
    throw new Error(
      `Trying to create data ${data.toString()} - ${JSON.stringify(
        data
      )}, but it does not implement the Creatable pattern`
    );
  }

  const entity = await creatable.create()(data, casID);
  return entity.id;
};

export const redirectEntity = (
  recognizer: PatternRecognizer,
  loadEntity: (entityRef: string) => Promise<Entity<any> | undefined>
) => async (entityRef: string): Promise<Entity<any>> => {
  const entity = await loadEntity(entityRef);

  if (!entity)
    throw new Error(`Could not find entity with reference: ${entityRef} when redirecting`);

  const redirect: HasRedirect = recognizer
    .recognizeBehaviours(entity)
    .find(b => (b as HasRedirect).redirect);

  const redirectRef = await redirect.redirect(entity);

  if (!redirectRef) return entity;
  return redirectEntity(recognizer, loadEntity)(redirectRef);
};

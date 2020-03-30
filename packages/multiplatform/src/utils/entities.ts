import { PatternRecognizer, Creatable, Pattern } from '@uprtcl/cortex';
import { Behaviour } from '@uprtcl/cortex/dist/types/types/behaviour';

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

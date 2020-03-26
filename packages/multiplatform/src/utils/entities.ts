import { PatternRecognizer, Creatable } from '@uprtcl/cortex';

/**
 * Generically create the given data and retrieve its hashed it
 *
 * @param data the data to create
 * @returns the created hashed data
 */
export const createEntity = (recognizer: PatternRecognizer) => async <T extends object>(
  data: T,
  usl: string
): Promise<string> => {
  const creatable: Creatable<T, any> | undefined = recognizer
    .recognize(data)
    .find(prop => !!(prop as Creatable<T, any>).create);

  if (!creatable) {
    throw new Error(
      `Trying to create data ${data.toString()} - ${JSON.stringify(
        data
      )}, but it does not implement the Creatable pattern`
    );
  }

  const hashed = await creatable.create()(data, usl);
  return hashed.id;
};

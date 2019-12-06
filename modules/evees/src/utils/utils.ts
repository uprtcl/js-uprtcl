import { PatternRecognizer, Hashed, Pattern, Creatable } from '@uprtcl/cortex';

/**
 * Generically create the given data and retrieve its hashed it
 *
 * @param data the data to create
 * @returns the created hashed data
 */
export const createEntity = (recognizer: PatternRecognizer) => async <T extends object>(
  data: T,
  upl?: string
): Promise<Hashed<T>> => {
  const creatable: Creatable<T, T> | undefined = recognizer.recognizeUniqueProperty(
    data,
    prop => !!(prop as Creatable<T, T>).create
  );

  if (!creatable)
    throw new Error(
      `Trying to create data ${data.toString()}, but it does not implement the Creatable pattern`
    );

  return creatable.create()(data, upl);
};

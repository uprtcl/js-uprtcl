import { PatternRecognizer, HasLinks, Entity, Pattern } from '@uprtcl/cortex';

import { KnownSourcesService } from './known-sources.service';
import { KnownSourcesSource } from './known-sources.source';

/**
 * Recognize the patterns from the object and get its links
 *
 * @param object the object
 * @returns the links implemented from the object
 */
export const linksFromEntity = (recognizer: PatternRecognizer) => async <O extends object>(
  entity: Entity<O>
): Promise<string[]> => {
  // Recognize all patterns from object
  const patterns: Pattern<Entity<O>>[] = recognizer.recognize(entity);

  const hasLinks = patterns.map(
    (p) => p.behaviours.filter((b) => (b as HasLinks<Entity<O>>).links) as HasLinks<Entity<O>>[]
  );

  const promises = ([] as HasLinks<Entity<O>>[])
    .concat(...hasLinks)
    .map(async (has) => has.links(entity));

  const links: string[][] = await Promise.all(promises);

  return ([] as string[]).concat(...links);
};

/**
 * Retrieves the known sources for the given hash from the given source and stores them in the known sources service
 * @param hash the hash for which to discover the sources
 * @param service the service to ask for the known sources
 */
export const discoverKnownSources = (localKnownSources: KnownSourcesService) => async (
  hash: string,
  type: string,
  source: KnownSourcesSource
): Promise<void> => {
  const knownSourcesNames = await source.knownSources.getKnownSources(hash);

  if (knownSourcesNames && knownSourcesNames.length > 0) {
    await localKnownSources.addKnownSources(hash, knownSourcesNames, type);
  }
};

export const getUplToDiscover = (localKnownSources: KnownSourcesService) => async (
  hash: string,
  allUpls: string[]
): Promise<string> => {
  if (allUpls.length === 1) return allUpls[0];

  // Get the known sources for the object from the local known sources service
  const knownSources = await localKnownSources.getKnownSources(hash);

  if (knownSources) return knownSources[0];
  else return allUpls[0];
};

/**
 * Execute the promises in parallel and return when the first promise resolves
 * Only reject if all promises rejected
 *
 * @param promises array of promises to execute
 * @returns the first resolved promise, or rejects if all promises rejected
 */
export function raceToSuccess<O>(promises: Array<Promise<O>>): Promise<O> {
  let numRejected = 0;
  let errors: Error[] = [];

  return new Promise((resolve, reject) =>
    promises.forEach((promise) =>
      promise.then(resolve).catch((e) => {
        errors.push(e);
        if (++numRejected === promises.length) reject(errors);
      })
    )
  );
}

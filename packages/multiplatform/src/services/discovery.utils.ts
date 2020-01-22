import { PatternRecognizer, HasLinks } from '@uprtcl/cortex';

import { KnownSourcesService } from './known-sources.service';
import { Source } from '../types/source';

/**
 * Recognize the patterns from the object and get its links
 *
 * @param object the object
 * @returns the links implemented from the object
 */
export const linksFromObject = (recognizer: PatternRecognizer) => async <O extends object>(
  object: O
): Promise<string[]> => {
  // Recognize all patterns from object
  const hasLinks: Array<HasLinks<O>> = recognizer
    .recognize(object)
    .filter(prop => !!(prop as HasLinks<O>).links);

  const promises = hasLinks.map(async has => has.links(object));

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
  source: Source
): Promise<void> => {
  if (!source.knownSources) return;

  const knownSourcesNames = await source.knownSources.getKnownSources(hash);

  if (knownSourcesNames) {
    await localKnownSources.addKnownSources(hash, knownSourcesNames);
  }
};

export const discoverLinksKnownSources = (
  recognizer: PatternRecognizer,
  localKnownSources: KnownSourcesService
) => async (object: object, source: Source): Promise<void> => {
  // Get the links
  const links = await linksFromObject(recognizer)(object);

  // Discover the known sources from the links
  const linksPromises = links.map(link => discoverKnownSources(localKnownSources)(link, source));
  await Promise.all(linksPromises);
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
    promises.forEach(promise =>
      promise.then(resolve).catch(e => {
        errors.push(e);
        if (++numRejected === promises.length) reject(errors);
      })
    )
  );
}

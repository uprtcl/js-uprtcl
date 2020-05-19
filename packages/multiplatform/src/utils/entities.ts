import { ApolloClient, gql } from 'apollo-boost';
import { PatternRecognizer, Entity } from '@uprtcl/cortex';
import { HasRedirect } from '../behaviours/has-redirect';

export const redirectEntity = (
  recognizer: PatternRecognizer,
  loadEntity: (entityRef: string) => Promise<Entity<any> | undefined>
) => async (entityRef: string): Promise<Entity<any>> => {
  const entity = await loadEntity(entityRef);

  if (!entity)
    throw new Error(`Could not find entity with reference: ${entityRef} when redirecting`);

  const redirect: HasRedirect = recognizer
    .recognizeBehaviours(entity)
    .find((b) => (b as HasRedirect).redirect);

  if (!redirect) return entity;

  const redirectRef = await redirect.redirect(entity);

  if (!redirectRef) return entity;
  return redirectEntity(recognizer, loadEntity)(redirectRef);
};

export async function loadEntity<T>(
  apolloClient: ApolloClient<any>,
  entityRef: string
): Promise<Entity<T> | undefined> {
  const result = await apolloClient.query({
    query: gql`
    {
      entity(ref: "${entityRef}") {
        id
        _context {
          object
          casID
        }
      }
    }
    `,
  });

  if (!result.data.entity) return undefined;

  const object = result.data.entity._context.object;

  return {
    id: result.data.entity.id,
    object,
    casID: result.data.entity._context.casID,
  };
}

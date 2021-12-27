# Querying Data

Linking and nesting becomes specially relevant when exploring and discovering data.

Typical content management applications support basic read and update operations, but they also need to filter and flexibly categorize content. In some web applications, like social networks, filtering and categorization is the essence of the application.

Remotes storing \_Prtcl data are expected to index their content and resolve queries for it (or at least point to a explore service where their content is indexed). Querying data in \_Prtcl follows a simplified approach purposely built around the concepts of linking and nesting instead of pretending to support a formal and complete query language like GraphQL or SparkQL.

While being specific and opinionated, \_Prtcl query standard is enough for building most content-management applications like web forums, personal and collaborative documentation applications and eventually social networks.

## Querying data

The result of a query is obtained by denoting one or more "starting" perspectives, and then specifying the search direction (exploiting the concept of nested perspectives) relative to them, which can be either 'above' or 'under'.

Searching 'above' a given perspective is a way of "locating" that object. The result of the query corresponds to all the other perspectives of which the given object is a child.

Searching 'under' a given perspective is a way of exploring a perspective content, since children are conceptually considered _part of_ their parents.

Once the "starting" perspectives set and the direction of search are provided, additional filters can be applied based on the presence or absence of generic links, and/or standard text-based filters.

Finally, querying supports specifying the number of levels to include above or below a perspective.

Nesting and linking can be used to design content-management applications with relatively advanced and opinionated business logic. See how it is used to build [Intercreativity ADD LINK]();

Queries are sent as a Javascript object compliant with the [following typescript interfaces](https://github.com/uprtcl/js-uprtcl/blob/master/core/evees/src/evees/interfaces/types.ts).

```ts
interface SearchOptions {
  start?: SearchOptionsTree;
  linksTo?: SearchOptionsLink;
  text?: {
    value: string;
    textLevels?: number;
  };
  orderBy?: string;
  pagination?: {
    first: number;
    offset: number;
  };
}

enum Join {
  inner = 'INNER_JOIN',
  full = 'FULL_JOIN',
}

interface SearchOptionsTree {
  joinType?: Join.inner | Join.full;
  elements: JoinTree[];
}

interface SearchOptionsLink {
  joinType?: Join.inner | Join.full;
  elements: string[];
}

interface JoinTree {
  id: string;
  direction?: 'under' | 'above';
  levels?: number;
  forks?: SearchForkOptions;
}

interface SearchForkOptions {
  exclusive?: boolean;
  independent?: boolean;
  independentOf?: string;
}
```

## Explore Services

In terms of architecture, \_Prtcl apps make a distinction between a Client Remote and a Explore Service. The Client Remote stores the head of each perspective, while the Explore Service resolves queries.

On web3 technologies, where data is stored on public networks, it's more natural to have one or more separate indexing services to explore the data, while on Web2 technologies it's probably normal that the Client Remote and the Explore Service are handled by the same backend platform.

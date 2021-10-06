# Querying Data

Linking and nesting becomes specially relevant when exploring and discovering data. All content management applications should support basic read and update operations, but they also need to filter and flexibly categorize content to work properly.

Remotes storing \_Prtcl data are also expected to index their content and resolve queries for it (or at least point to a explore service where thier content is indexed). Querying data in \_Prtcl follows a simplified approach purposely built around the concepts of linking and nesting instead of pretending to support a formal and complete query language like GraphQL or SparkQL.

While being specific and opinionated, \_Prtcl query standard is enough for building most content-management applications like web forums, personal and collaborative documentation applications and eventually social networks.

## Quering data

Querying \_Prtcl data is currently limited to a filtering operation, this is, each query should start from the global set of all perspectives and return a subset.

The subset of perspectives is obtained by denoting one or more "starting" perspectives, and then specifying the search direction (exploting the concept of nesting links) relative to them, which can be either 'above' or 'under'.

Searching 'above' a given perspective is a way of "locating" that object. The result of the query corresponds to all the other perspectives of which the given object is a child.

Searching 'under' a given perspective is a way of exploring a perspective content, since children are conceputally considered _part of_ their parents.

Once the "starting" perspectives and the direction of search are provided, additional filters can be applied based on the presence or absence of generic links, and/or standard text-based filters.

Finally, querying supports specifying the number of levels to include above or below a perspective.

Nesting and linking can be used to design content-management applications with relatively advanced and opinionated business logics.

The figure below shows how what would be a flat graph is usually represented in \_Prtcl, and how local trees arise from the child links between the perspectives. In the figure, the red dashed box is the set of perspectives above "p7", while the violet dahsed box represents the set of perspectives under "p7".

The blue dashed links are generic links that can be used to filter results, for example, querying all perspectives under "p7" having a link to "p9"

![](https://docs.google.com/drawings/d/e/2PACX-1vT1REC7ejiZx8QLJ_kBNp06tHxzUS9LHzEv4tx-8W1R1gab_iNVCoB5GbPyIyItVcsrsoZmbjq52y5F/pub?w=620&h=729)

## Explore Services

In terms of architectur, \_Prtcl apps makes a distinction between an Client Remote and a Explore Service. The Client Remote stores the head of each perspective, while the Explore Service resolves queries.

On web3 technologies, where data is stored on public networks, it's more natural to have one or more separate indexing services to explore the data, while on Web2 technologies it's probably normal that the Client Remote and the Explore Service are handled in the same platform.

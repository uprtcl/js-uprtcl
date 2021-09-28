# How is data managed in a \_Prtcl application?

An \_Prtcl application can handle data stored on different platforms or "remotes".

Each data object has a global unique identifier that we refer to as the perspective ID.

A perspective ID is similar to a URL in the sense that it is a global, unique and mutable identifier for the object, however it is also similar to a GIT branch in the sense that it resolves to a commit-like "entity".

We call "entities" inmutable and content-addressable objects, while "perspectives" are mutable references to the latest commit.

## Basic CRUD operations

A remote is a Javascript class that connects to a platform or network and that can, through any mechanism, resolve a perspective ID into the hash of its current head commit.

On its most basic form, remotes must support basic CRUD operations on perspectives, and must also resolve hashes into their corresponsing entities.

The simplest "remote" can be a REST API with a single type of objects: perspectives, whose values are only strings with the hash of the current head commit of that object, and another endpoint for "entities" that resolves a hash into it's corresponding entity.

We extend the concept of a remote beyond a standard API so that we can cover non-HTTP storage platforms such as emerging decentralized networks.

## Linking and nesting

Perspectives in \_Prtcl can be linked among them similar to how URLs can be added as hyper-links inside an HTML document. In \_Prtcl, links are added directly by adding the perspective ID of the target of the link inside the JSON object (more about this later).

Here is where \_Prtcl starts differring from other approaches liked Linked-Data and the semantic web.

Because \_Prtcl is focused on content-management applications and most content management applications follow a hiearchical structure, we have decided to keep the nesting of two perspectives as special type of link among them.

Nesting a perspective B under perspective A is done by adding a link of type "child" on perspective A. Once this is done, perspective B is considered to be part of perspective A.

Child links are important because they determine the hierarchical structure of linked perspectives. While horizontal generic links remain available for cross-linking perspective, vertical hierarhical links remain common and used to build high order objects out of smaller ones.

While the semating web sees the space of linked objects as a flat and generic graph, \_Prtcl sees it more as a "city of pyramids" this is, hierarchies are very common and relevant, while cross-linking is still possible.

## Exploring / Discovering

Links and nesting becomes relevant when exploring and discovering data. Content management applications must support CRUD operations, but they also need to intelligently filter and categorize content.

Similar to the semantig web, remotes storing data are also expected to be able to index their content and resolve queries about it.

However, instead of using a generic query language like GraphQL or SparQL, \_Prtcl promotes the use of an ugly and very opinionated reduced interface for data quering that is limited to the concepts of link, nest, text-based search and some \_Prtcl metadata.

The hope is that, while being very specific and opinionated, it is enough for building most content-management applications including web forums, documentation applications and eventually social networks.

To this end a \_Prtcl remote must be able to resolve queries that are specified with one or more of the following criterion:

- `under`: Representing the set of perspective that are children or childrent of the children of a given perspective.
- `above`: Representing the set of perspectives that from which a given perspective is a child of a child of a child.
- `linksTo`: Representing the set of perspectives having a link to a give target perspective.
- `text`: Representing the set of perspectives whose content matches a text criteria.
- \_Prtcl metadata.

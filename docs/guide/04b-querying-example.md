# Querying Example

Consider a set of perspectives nested and linked as shown in the figure below.

![](https://docs.google.com/drawings/d/e/2PACX-1vTVyLbMQIKa7wrLiyYH6ZEOWbkkttstlOwMySNTU8m4q41bR9xxMZJ43voPGWUv3_LKSqkHXW21sXgX/pub?w=922&h=600&a=2)

We can assume that, for example, these objects represent a task management application, where `p1` and `p2` are container objects (boards), `p11`, `p12`, `p21`, `p22` and `p31` are cards, and `p221`, `p321` and `p421` are tasks inside a card. Note that `p12` is both inside `p1` and `p2`.

### Searching under a given ecosystem

A perspective ecosystem is given by the children and the children of the children, recursively, of a given perspective.

If we want to search the cards and tasks that are "on" the second "board" (`p2`), based on a text string, we would simply do as follows.

```gql
query = {
  start: [
    {
      elements: [
        {
          id: p2,
          levels: -1,
          direction: 'under',
        }
      ]
    }
  ],
  text: {
    value: 'develop',
  }
}
```

This query would match: `p2`, `p13`, `p21`, `p22`, and `p221`, which is shown in the figure below:

![](https://docs.google.com/drawings/d/e/2PACX-1vTk0ZFO1mpJtjMmgAtXnqB24JeKpm7K8QnbfBJqSWBevgkJzmpFgQmarh0TcJzi_HrpPgeKOiHVNNSP/pub?w=878&h=609&a=1)

The levels property means that we want to search the entire ecosystem of `p2`, in as many children levels as there exist.

Finally, note that `leves: -1` and `direction: 'under'` are not needed as these are the default values, but are included here for sake clarity.

### Searching forks of a given perspective

If we now want to search for the forks of a perspective, let's say all forks of `p1`, we can do this by including the `forks` property in the query, as follows:

```gql
query = {
  start: [
    {
      elements: [
        {
          id: p2,
          levels: 1,
          forks: {
            exclusive: true
          }
        }
      ]
    }
  ],
}
```

This would return all the forks of the `p2` perspective, and not of its children (since `levels = 1`), and it will not return `p2` since `exclusive = true`. The result of the query is, therefore, `p1`.

![](https://docs.google.com/drawings/d/e/2PACX-1vQjpny5StC0JmWhjRlHiu9rVDVXEGTbNdPTruMQtU8qkQ2WaomADxMZr-uoTj9coFfaBHqkzo-DpQYu/pub?w=878&h=341&a=1)

### Searching forks of a perspective and its ecosystem

If we want to search for forks of a given perspective and/r any element within its ecosystem, we would achieve this by setting `levels = -1`.

This would correspond to the case where we would like to get any fork of the board or any card or task within the board `p2`.

The query would then look like:

```gql
query = {
  start: [
    {
      elements: [
        {
          id: p2,
          levels: -1,
          forks: {
            exclusive: true
          }
        }
      ]
    }
  ],
}
```

This would return `p1`, `p11`, `p12`, `p32`, `p321` and `p421` since

- `p1` is a fork of `p2`,
- `p11` is a fork of `p21`,
- `p12` and `p32` are both forks of `p22`,
- `p321` and `p421` are both forks of `p221`.

![](https://docs.google.com/drawings/d/e/2PACX-1vTGLRon8cslYergVP6jLRcTAQkUeEFLHNA_gkq8NZt6q9WpxPoKcRMTC2Cx7GWpiuhmZrwjO0mEHya1/pub?w=878&h=341)

This is a typical case where forks of an ecosystem are somewhat redundant in the sense that when a board is forked, a fork of each of its elements is also created by default.

In this example, its probably the case that `p2` was forked from `p1` when `p1` had only `p11` and `p12` as children. When the fork was done, `p2` was created and so were `p21` and `p22`.

Knowing that the `p2` board has a fork (`p1`) is enough to infer that the cards `p21` and `p22` also have a fork.

To reduce this redundancy from the query results. We have included the concept of an independent fork.

> An independent fork of perspective A, when perspective A is a child of perspective B, is defined as a fork of perspective A which does not have a parent that is also a fork of perspective B.

In this example, the fork `p11` of perspective `p21` is not and independent fork of `p21` under `p2`, because `p11` has a parent (`p1`) which is a fork of the parent of `p21` (`p2`). The same occurs to `p12`.

On the other hand `p32` is a fork of `p22`, but it is not the child of he any fork of `p2`, and is, thus, an independent fork of `p2`.

`p321` is a fork of `p221`, but its parent `p32` is also a fork of `p22`, and thus, `p321` is not an independent fork of `p221`.

Finally, note that `p421` is an independent fork of `p321`.

The final set of independent forks of `p2` and its ecosystem is shown below. This set provides a clean overview of all the relevant forks of elements inside `p2`.

![](https://docs.google.com/drawings/d/e/2PACX-1vRQD92-CnKMtw0tjT2IVw9pl1L_WnWZxp-6zEfcP5G-qKzR5ztPtTawAsW7fAWfI90Z-l07w1JLRfpD/pub?w=878&h=341&a=1)

## Filtering based on cross-links

As already mentioned in the [Linking Data](/guide/03-linking/) section, cross-links can be used to build bottom-up categories, this is, categories which are defined by each of the elements they contain, and not by the owner of the category perspective.

This could be used, for example, by content-management applications to create tags for the objects they handle, a feature that is common in many applications. However, tags, if local to the workspace of one author, can also be achieved using "children" links, since one perspective can be the child of many parents, and thus one can apply many tags to one element using children links.

A better use case for cross-links emerge when categories are supposed to have a meaning outside of the workspace of a single user. This can be used for supporting interoperability among applications by the creation of remote-less (and authority-less) perspectives.

We call a remote-less perspective a "concept perspective". A "concept perspective" will have the `remote` property empty, and will include additional information in the other properties that will make it unique.

For example, a simple concept perspective will be a perspective to represent the concept of a "blog-post". It could be of the form:

```ts
const perspective: Perspective = {
  remote: '',
  path: '',
  creatorId: '',
  timestamp: 0,
  context: 'blog-bost',
};
const pC1: string = hashObject(perspective);
```

Once the concept perspective id is found, an application can mark some of the content created by its users as a "blog-posts" by adding a cross-link between the perspective that holds the content (say a bunch of text), and the blog-post concept perspective.

### Getting all objects of a given category on a remote

With the use of the concept perspective, a user can, for example query a given remote for all the blog-posts it contains with the following query:

```gql
query = {
  linksTo: 'pC1'
}
```

### Getting all objects of a given category and of one user on a remote

Or, if what the user wants is to see the blog posts of a single user (a user feed), then this can be achieved by combing the concept of ecosystems and cross-links as follows:

```gql
query = {
  start: [
    {
      elements: [
        {
          id: userHome,
          levels: -1,
        }
      ]
    }
  ],
  linksTo: 'pC1'
}
```

Where `userHome` is the "home perspective" of that user in that remote, it's id is public, but its content can very well be private. The user "home perspective" on a give remote (`remote-a` in this simple example) can be computed by anyone as it will have this form:

```ts
const perspective: Perspective = {
  remote: 'remote-a',
  path: '',
  creatorId: 'userId',
  timestamp: 0,
  context: '',
};
const userIdHome: string = hashObject(perspective);
```

### Getting all objects of a given category and of the people I follow on a remote

Now if a user wants to get all the blog-posts of a set of user whom he "follows", this can be achieved by creating a "following" perspective and adding, as children, the home perspectives of the users they want to follow. This can be done automatically by the consuming application, instead of manually by the user.

```gql
query = {
  start: [
    {
      elements: [
        {
          id: following,
          levels: -1,
        }
      ]
    }
  ],
  linksTo: 'pC1'
}
```

### Final remarks

As the examples above show, it's possible to build app familiar user experiences with the use of the concept of ecosystems and cross-links, and without having to create custom data types with their underlying database.

This is a good first step for obtained interoperability, in the sense that objects are not stored on object-specific tables, but all objects/perspectives are stored on the same table where only the children and cross-links need to be indexed.

Similar things can be achieved by using MBaaS platforms like Firebase and headless CMS platforms like Netlify. The key aspect of \_Prtcl is that it is designed to support multiple remotes from one application by building a standard interface for basic CRUD operations and more complex data querying.

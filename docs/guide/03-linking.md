# Linking Data

Linking and nesting in \_Prtcl is inspired on the data structure of most modern content-management web-applications, and is designed to support the typical functionalities of these applications.

This is a subtle, but significant!, difference from the way linking was _reasoned_ about on Web 1.0 technologies and the semantic web, where links are supposed to be related with real-world relationships, and most linking examples are of the like: "is friend of".

In \_Prtcl, links are not designed to build ontologies that would serve to model the relationships between real world assets like people, companies or places. Instead, links are designed to support the data structure and features of typical content-management web-applications.

In some ways, links in \_Prtcl are more inspired in file systems than in tools to build and handle ontologies.

One key result of this approach is that perspectives in \_Prtcl can be linked in two different ways: generic **links**, and a more specific type of links for **nesting** perspectives.

Nesting is very common in most web-applications, and also in file systems, where files and folders are stored inside of folders.

While it is usually not considered a typical "linking action", at the architecture level, it usually is an actual link between two objects, starting in the parent and pointing to the child.

\_Prtcl proposes to consider the space of data handled by web applications as a global file system where files (objects in this case) can be nested under each other by different authors and on different platforms.

## Nesting and local hierarchies

Nesting a perspective B under perspective A is done by adding a link of type "child" on perspective A. Once this is done, perspective B is considered to be _a part of_ of perspective A.

Child links are important because they explicitly determine the hierarchical structure of linked perspectives. While horizontal generic links remain available for cross-linking perspectives.

Vertical hierarchical links can be used to build high order objects out of smaller ones and create the concept of content "areas", or "ecosystems". An ecosystem then serves also as a map of authority, in the sense that the authority of upper level perspective can always decide what is nested inside of them.

While the semantic web sees the space of linked objects as a flat and generic graph, \_Prtcl sees it more as a network of containers. Hierarchies are expected and common, while cross-linking is still possible.

Because it's the parent perspective who decides who is added as child perspective, it's totally possible that one perspective is added as a child of two or more perspectives by multiple creators and on different applications or platforms.

Under these conditions it should be clear that, while having the notion of hierarchies, the actual data structure of \_Prtcl perspectives is formally not a single tree, but still a generic graph. However, the concept of hierarchy, even if only locally valid, is still very useful for querying data, as it will be shown in the next section.

## Categories based on nesting vs linking

Exploring and querying ecosystems of a perspective (based on children-type links) is a typical feature of many content-management applications.

This feature enable apps to categorize content top-down in terms of authority. This is "categories" are objects/perspectives themselves that can control their content by being updated themselves.

Authority flows down, from the owner of the category perspective to its elements, and thus, it can be derived that the presence of an element in a category is acknowledged by the owner of the category perspective.

In some cases, however, apps need categories that are defined bottom-up. This is, the owner of each element in the category is the one who decides weather the element belongs or not to one (or more) categories.

This is achieved by a cross-links. A cross-link link does not extends the ecosystem of a perspective, meaning it's target is not considered a child of that perspective, and can be used to query perspectives either exclusively or in combination to the ecosystem criteria.

## Summary

There are two types of links in \_Prtcl, children links, which can be used to build hierarchies by extending the ecosystem of a perspective, and cross-links which do not extend the ecosystem. Both links can be used to query perspectives.

The figure below shows 4 objects linked among them. Perspective "p1" is a container object, for example a "board" on a web-application, and have "p2" and "p3" as children objects, say cards. Perspective "p3" has a link to "p4".

The ecosystem of "p1" includes "p2" and "p3", while it does not include "p4".

Finally, note that "p1", "p2", "p3" and "p4" does not need to be stored on the same Evees Remote. This is, one hierarchy can be composed of objects stored on different remotes.

![](https://docs.google.com/drawings/d/e/2PACX-1vTlwxnwMdFmxSVZawuTyNg8Equwl8LpErjwJgAsJxN0F0uNDislMWMEJXe7YH5ECYhBYesaguG5giNv/pub?w=560&h=210)

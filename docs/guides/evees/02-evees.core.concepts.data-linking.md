# How is data linked in \_Prtcl?

Linking and nesting in \_Prtcl is inspired on the data structure of most modern content-management web-applications, and is designed to support the typical functionalities of these applications. This is a subtle but significant difference from the way linking is _reasoned_ about on Web 1.0 technologies, where links are supposed to be related with real-world relationships like "is friend of".

In \_Prtcl, links are not designed to build ontologies that would serve to model the relationships between real world assets like people, companies or places. Instead, links and nesting relationships are designed to support the data structure of typical web-applications like posts, notes, folders, tags and feeds.

Perspectives in \_Prtcl can be linked among them similar to how URLs can be added as hyper-links inside an HTML document, or objects can reference each other on Linked Data. However \_Prtcl separates between two types of links: generic links, and a more specific type of links for **nesting** perspectives.

## Nesting and local hierarchies

Nesting a perspective B under perspective A is done by adding a link of type "child" on perspective A. Once this is done, perspective B is considered to be _inside_ of perspective A.

Child links are important because they explicitely determine the hierarchical structure of linked perspectives. While horizontal generic links remain available for cross-linking perspectives.

Vertical hierarchical links can be used to build high order objects out of smaller ones and create the concept of content "areas", or "ecosystems". An ecosystem then serves also as a map of authority, in the sense that the authority of upper level perspectivive can always decide what is nested inside of them.

While the semanting web sees the space of linked objects as a flat and generic graph, \_Prtcl sees it more as a network of containers. Hierarchies are expected and common, while cross-linking is still possible.

Because it's the parent perspective who decides who is added as child perspective, it's totally possible that one perspective is added as a child to two or more perspectives by multiple creators and on different applications or platforms.

Under these conditions it should be clear that, while having the notion of hierarchies, the actual data structure of \_Prtvcl perspectives is formally not a single tree, but still a generic flat graph. However, the concept of hierarchy, even if only locally valid and not unique, is still useful as will be shown later in the sample applications.

![](https://docs.google.com/drawings/d/e/2PACX-1vTlwxnwMdFmxSVZawuTyNg8Equwl8LpErjwJgAsJxN0F0uNDislMWMEJXe7YH5ECYhBYesaguG5giNv/pub?w=560&h=210)

The figure above shows 4 objects linked among them. Perspective "p1" is a container object, for example a "board" on a web-application, and have "p2" and "p3" as children objects, say cards. Perspective "p3" has a link to "p4".

The ecosystem of "p1" includes "p2" and "p3", while it does not include "p4".

Finally, note that "p1", "p2", "p3" and "p4" does not need to be stored on the same Evees Remote.

# Forking Perspectives

We refer to objects in \_Prtcl as "perspectives" and showed that they can be stored on different platforms and can be linked among them with two types of links: a generic link and a dedicated "nesting" link. In addition to this, we now introduce the concept of "forking" perspectives.

Forking a perspective into another perspective can be done by adding a new tip to the version history of that perspective. We then refer to the virtual object made of the set of multiple tips/perspectives, as one "Evee".

One "Evee" can have multiple perspectives, each one of them behaving as an independent digital object, on multiple platforms and governed by different authors.

A perspective object has one property named `context` that can be used to identify which Evee that perspective is part of. Two perspectives of the same "Evee" are then expected to have the same "context" while potentially be stored on different remotes and controlled by different users.

## How to use multiple perspectives of one Evee

Evees are exposed to \_Prtcl applications through the standard querying process. This is, while querying for perspectives, it is possible to explicitely request/includes the forks of a perspective as part of the results.

Once different perspectives of the same Evee have been found, they can be compared (recursively to compare their children too) and can be merged, bringing the changes made on of them back into the other.

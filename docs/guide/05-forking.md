# Forking Perspectives

We refer to objects in \_Prtcl as "perspectives" and showed that they can be stored on different platforms and can be linked among them with two types of links: a generic link and a dedicated "nesting" link. In addition to this, we now introduce the concept of "forking" perspectives.

Forking a perspective into another perspective can be done by adding a new tip to the version history of that perspective. We then refer to the virtual object made of the set of multiple tips/perspectives, as one "Evee".

One "Evee" can have multiple perspectives, each one of them behaving as an independent digital object, on multiple platforms and governed by different authors.

A perspective object has one property named `context` that can be used to identify which Evee that perspective is part of. Two perspectives of the same "Evee" are then expected to have the same "context".

## Forking nested perspectives

The data structure of perspectives in \_Prtcl and GIT branches is not different at all. A git "branch" is an "\_Prtcl" perspective in the sense that it is a pointer to it's latest commit head, and commits are hash-chained on top of each other.

Beside this, \_Prtcl uses global identifiers (like URLs) to refer to each branch/perspective, instead of simple local strings, and then interprets this global branch ids as typical object URLs, not so different from other objects URLs handle by web-applications.

The big difference comes from the fact that \_Prtcl also aims at nesting these objects to build higher order ones. It's a concept similar to GIT submodules, but handled differently as \_Prtcl supports adding a branch as a child of a perspective, instead of having to add a specific commit.

This is important as, otherwise, every time a child is updated, all its parents would also need to be updated to point to the new version of the child. As a result, however, the version of the children is not encoded in that of the parent which means that 

## How to use multiple perspectives of one Evee

Evees are exposed to \_Prtcl applications through the standard querying process. This is, while querying for perspectives, it is possible to explicitely request/includes the forks of a perspective as part of the results.

Once different perspectives of the same Evee have been found, they can be compared (recursively to compare their children too) and can be merged, bringing the changes made on of them back into the other.

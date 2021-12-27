# Forking Perspectives

We refer to objects in \_Prtcl as "perspectives" and showed that they can be stored on different platforms and can be linked among them with two types of links: a generic link and a dedicated "nesting" link. In addition to this, we now introduce the concept of "forking" perspectives.

Forking a perspective into another perspective can be done by adding a new tip to the version history of that perspective. We then refer to the virtual object made of the set of multiple tips/perspectives, as one "Evee".

One "Evee" can have multiple perspectives, each one of them behaving as an independent digital object, on multiple platforms and governed by different authors.

A perspective object has one property named `context` that can be used to identify which Evee that perspective is part of. Two perspectives of the same "Evee" are then expected to have the same "context".

## Forking nested perspectives

The data structure of perspectives in \_Prtcl and GIT branches is not different at all. A git "branch" is an "\_Prtcl" perspective in the sense that it is a mutable pointer to it's latest commit head, and commits are hash-chained on top of each other.

Beside this, \_Prtcl uses global identifiers (like URLs) to refer to each branch/perspective, instead of local strings, and then interprets this global branch ids as typical object URLs, not so different from other objects URLs handle by web-applications.

The big difference comes from the fact that \_Prtcl also aims at nesting these objects to build higher order ones. It's a concept similar to GIT submodules, but handled differently as \_Prtcl supports adding a branch as a child of a perspective, instead of having to add a specific commit.

This is important as, otherwise, every time a child is updated, all its parents would also need to be updated to point to the new version of the child.

## Example

### Documents as nested perspectives

To fully clarify how nesting and recursive forking is done in \_Prtcl, let's consider an example of a document made of multiple nested perspectives.

First, we will consider the case of using GIT to store a document while trying to keep a modular version control for portions of the document.

To this end we would have a markdown file in the root folder of the repository, and will have a new folder for each sub-section in the document, each with its own text file for the content. The folder structure in this example would be as follows:

![](https://docs.google.com/drawings/d/e/2PACX-1vQtSr7otCTevpGVkJguWg2IDo4CczRQmYEC_ZS6OdGbHh_KNPzPID5B-vueENqI8meeWmrODBTlQwor/pub?w=250).

With this structure, each change to the document would add a new commit to the GIT repository. If a user wants to create a modification of the content of Section 1, he needs to branch the entire repository, updating the GIT repository database in the root folder, and then change the contents of that section's file.

![](https://docs.google.com/drawings/d/e/2PACX-1vS-BgtufemXRCTg1MynAH21eW7CikTG6XsIVB8IM88kLDeU-EkFoSiU4npBd7M56BxpVx0RM5U6il1P/pub?w=800)

Now, let's consider the case of the \_Prtcl. In this case each element of the document would be a perspective of an Evee and there would be six perspectives building the entire document:

- The document itself would be an Evee let's call it `DOC1` with content “Document 1”,
- Three children Evees of `DOC1`: The first paragraph and the two subsections.
- Each of these subsections would then have a child evee with their corresponding content.

The figures below show these six Evees and their links as children. The figure also shows how the new perspective of the content of Section 1 (`SIT`) is a perspective/branch of that Evee only, and not of the entire document.

![](https://docs.google.com/drawings/d/e/2PACX-1vTytsM_uOnHrOPpSUMQ9VjuItYGCrWX3p17J8OAFc0i51Bq1ZdfCZSdhIsgS7sKuQ-P1Wi_WYmRLvq8/pub?w=800).

Mapping these perspectives into the different portions of the document would look like this:

![](https://docs.google.com/drawings/d/e/2PACX-1vQKV_90TD_nKZIPFrxUHKDUMB5j1qvaFBEBDw8vay37IN2HQx3rTeBh3HRGI1Oz06pfr_Yti-I6pqst/pub?w=800)

With \_Prtcl, it is now possible for the new perspective on the `SIT` Evee to be reused on another document, say, for example, `DOC2`, without losing the link to its version within the `DOC1` context.

This link can be, eventually, used to bring back changes in `SIT` made in `DOC2` back into `DOC1`, and it would had been lost if `DOC2` were being created as a new GIT repository that "reuses" that same `Sit ei.txt` file.

Note that, with \_Prtcl, the same perspective of an Evee, say a paragraph or an entire section, can live in two different parent Evees at the same time.

In the figure below, the mutation perspective of the `SIT` context is reused in another context `DOC2` without losing the link with the original document. The figure shows two interconnected “ecosystems” of `DOC1` and `DOC2`.

![](https://docs.google.com/drawings/d/e/2PACX-1vRW7JfqrlS4a2_6jsoArQHjoV4euRXbIkpVzjtDzGJnbGx_4AiNkDK62ZebZqKNbdLVNMVPjN3JnpHr/pub?w=800)

And the "document" representation of these two set of Evees would look like this:

![](https://docs.google.com/drawings/d/e/2PACX-1vTLs2fJ8ozbP4VPKa-SlCScOfzvHXyX7Hm1ayU7Eo0C_ZcUbGBIwgoUNd--Am9RZt3Lghtp8SzHSk9s/pub?w=800)

### Forking an ecosystem

Creating a new perspective of an Evee by forking one of its perspectives is down as follows:

1. Create a new perspective that points to the head (last) commit of the current perspective of that Evee.

2. Create a new perspective on each of the children perspective and point them to the head (last) commit of their current perspective.

3. Add a commit to the parent perspective updating the links to its children so that they point to newly created perspectives of the children.

4. Recurse, from steps 2 on the children perspectives.

### Forking an ecosystem - Example

An example of a case where `DOC1` ecosystem is recursively forked is recursively forked is below. Blue tags are the ids of the current perspectives for each Evee and point to their corresponding head commit (blue circles). The global perspective operation creates a new perspective on `DOC1` (with new ids in yellow tags) and all of its children and adds a commit (yellow circles) to perspectives with children (`DOC1`, `S1` and `S2` ), to update their children links to point to the newly created perspectives of their children.

![](https://docs.google.com/drawings/d/e/2PACX-1vRP-Sjd09ucb_zFrkjPYMyWbFVaOBQHmHSHhQ7mTtQBobbenb5QPl23ZptTjatVeg9vv6BciIxt-JNK/pub?w=800)

The visualization of a new global perspective of DOC1. The content remains the same although new perspectives and links among them have been created.

![](https://docs.google.com/drawings/d/e/2PACX-1vRj5HqrUcysPXTVKHJBxhomOCf_m8X45AVjy3knfToFRd7uO2H4eDnt2xSQdD8zmsjY6vCNQJxOI-Fr/pub?w=800)

### Merging two ecosystems

The connections between different perspectives through their children links is used when doing merges, which, as is the case for new perspectives, are different in \_Prtcl than in GIT.

The following is the process to globally merge two perspectives, conceptually we want to merge perspective B (yellow tags) into perspective A (blue tags), of the same Evee by adding a new commit into perspective A:

If the data in perspective B has been modified and data in perspective A have not, then data in perspective A will now point to the same data object of perspective B. If, on the other hand, data has been modified in perspective A, try to merge both data sets using custom merging functions (see below).

For each children perspective in perspective B:

- Check if there is a children link to a perspective of that same Evee in perspective A.

- If there is such a link, then merge those two perspectives of the recursing this same algorithm and leave the link of perspective A untouched.

- If there is not such a link, then this is a new perspective. Create a new fork of the child of perspective B and add a link on perspective A to that new fork.

- Remove children links in perspective A which are not found on perspective B.

> Note: This should be improved. The final code includes a couple of additional details.

## How to use multiple perspectives of one Evee

Evees are exposed to \_Prtcl applications through the standard querying process. This is, while querying for perspectives, it is possible to explicitely request/includes the forks of a perspective as part of the results.

Once different perspectives of the same Evee have been found, they can be compared (recursively to compare their children too) and can be merged, bringing the changes made on of them back into the other.

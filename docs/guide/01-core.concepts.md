# Introduction

## Where is data stored in a \_Prtcl application?

\_Prtcl applications can handle data stored on different platforms or "remotes" where each data object has a global unique identifier that we refer to as the "perspective id".

The word "perspective" is pretty much the way "a data object" is called in \_Prtcl. It's called this way because objects can have many "forks", and thus each one is "one perspective" of the same "thing". We then call that "thing" an "Evee".

An Evee is a virtual object with many "perspectives" on different platforms and controlled by different authors.

A perspective id is similar to a URL in the sense that it is a global and unique locator for that perspective, however it is also similar to a GIT branch in the sense that it resolves into the hash of the latest commit of that perspective.

The head commit itself then codifies the entire version history of that perspective and the current/latest version by having links to the hash of the current data and to parent commits.

In the figure below, one application is handling content from three different platforms: A web-server, OrbitDB and Ethereum.

![](https://docs.google.com/drawings/d/e/2PACX-1vSbcI2SNPOy0QRSYzg-lYUKfSEkXtvQTuqH72hiQCnXoElPZPUZNGAww_LuQwSK27M9pn-5EQkNEQCY/pub?w=600&h=400)

\_Prtcl vison is not too different from one of a world of applications all of them offering an open and standard API to their data. It can be implemented in Web2 applications, on top of open and standard APIs and/or on Web3, where data, by definition is not wall-gradened by any single entity.

## Basic operations (Read and Update)

A "Client Remote" is a platform or network from which a perspective's current head commit can be read and updated. A remote is included as part of an application using a javascript connector class.

In \_Prtcl, there is a clear distinction between Client Remotes, which are platforms that store mutable references and can, thus, store and update the hash of the latest commit of a given perspective, and "Entity Remotes", which are platforms that store the hashed objects.

An application can use one or more Entity Remotes to store hashed objects. This is because an Entity Remote cannot manipulate the data it stores without changing its hash and, thus, it doest not need to be trusted the same way a Client Remote does.

A single platform, such as a web server, can play the role both of an Client Remote and an Entity Remote, storing both the current head of each perspective, as long as it's associated entities.

Making explicit the Client Remotes and Entities Remote on the previous figure would result in the figure below. Note that both OrbitDB and Ethereum use the same Entity Remote (IPFS).

![](https://docs.google.com/drawings/d/e/2PACX-1vTXuJlFy6Og_Eu3ECRsJMAuLcVtpqOTiFTtP9qaoRSbwfdpiGLuOnDu2E1igqvUvkG9Pp3UcaMBGJuw/pub?w=600&h=800)

## Access Control

Access control is determined by the remote platform. Remotes can store public and private objects and include any authenticacion process. Applications will usually need to authenticate the current user to each remote independently.

If remotes use an authentication method based on public-private-key cryptography, it's then possible to use the same identity source (private-key) to authenticate one user into multiple remotes at once.

Requests to protected perspectives that are not accessible to the requesting user will simply not provide or update the current head of the perspective.

# Where is data stored in a \_Prtcl application?

\_Prtcl applications can handle data stored on different platforms or "remotes" where each data object has a global unique identifier that we refer to as the perspective id (a perspective is "an object" in \_Prtcl).

A perspective id is similar to a URL in the sense that it is a global and unique identifier for that perspective, however it is also similar to a GIT branch in the sense that it resolves into the hash of the latest commit of that object.

The head commit itself then codifies the entire version history of that object and the current/latest version by having links to previous commits.

In the figure below, one application is handling content from three different platforms: A web-server, OrbitDB and Ethereum.

![](https://docs.google.com/drawings/d/e/2PACX-1vSbcI2SNPOy0QRSYzg-lYUKfSEkXtvQTuqH72hiQCnXoElPZPUZNGAww_LuQwSK27M9pn-5EQkNEQCY/pub?w=600&h=400)

\_Prtcl vison is one of a world of applications all of them offering an open and standard API to their's user data, letting each user decide which data is to be shared and with who, instead of the platform owner.

## Basic operations (Read and Update)

An "Evees Remote" is a platform or network from which a perspective's current head commit can be read and updated. A remote is included as part of an application using a JS connector class.

In \_Prtcl, there is a clear distinction between Evees Remotes, which are platforms that can store mutable references and can, thus, store and update the hash of the latest commit of a given object, and "Entity Remotes", which are platforms that store the hashed objects.

In principle, one or more Evees Remotes can interchangeably use one ore more Entity Remotes. This is because an Entity Remote cannot manipulate the data it stores without changing its hash and, thus, it doest not need to be trusted the same way an Evees Remote does.

One platform, such as a web server, can play the role both of an Evees Remote and an Entity Remote, storing both the current head of each perspective, as long as it's associated entities. However, for some web3 platforms, limiting mutable references single short hashes and moving the actual data payloads to be stored on a different platform is adviced.

Making explicit the Evees Remotes and Entities Remote on the previous figure would result in the figure below. Note that both OrbitDB and Ethereum use the same Entity Remote.

![](https://docs.google.com/drawings/d/e/2PACX-1vTXuJlFy6Og_Eu3ECRsJMAuLcVtpqOTiFTtP9qaoRSbwfdpiGLuOnDu2E1igqvUvkG9Pp3UcaMBGJuw/pub?w=600&h=800)

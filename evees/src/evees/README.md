# Evees Module

This module includes all the tools needed to create and manipulate Evees: GIT-Like objects that can be stored on different remotes, can be nested and linked together and evolve as a squence of content addressable hashed commits.

The `/interfaces` folder includes all the imporant inferfaces for \_Prtcl-compatible services to handle evees.
The `/clients` folder includes core implementations of the `EveesClient` interfaces: local, in memory and a router to connect with different EveesRemotes.
The `/elements` folder includes web-components to manipulate Evees.
The `/merge` folder includes the recursive, context-based merge logic.
The `/patterns` folder includes the patters for a Perspective and a Commit object.

The `evees.service.ts` inlcudes the top Evees service which is designed to be the entry point to all Evees related operations by consuming applications and components.

# Glossary

## Basic concepts

- **\_Prtcl**: The Underscore Protocol, \_Prtcl-powered applications work with Evees and the Cortex Framework.

- **Evee**: *Evolving entity*, a digital piece of content that evolves following as a sequence of content addressable commits and can live in different platforms.

- **Perspective** (branch in Git): An evolving version of an Evee (on tip of its sequence of commits. One of the core concepts of \_Prtcl.

- **Commit** (commit in Git): A content addresable object pointing to a content addressable data object with the _current_ content of an Evee and its previous/parent Commit, pointing to the previous content of the Evee. One of the core concepts of the \_Prtcl.

- **Context**: An arbitrary string that can be used to mark that two perspectives belong to the same Evee (without having to trasverse their commit history or even if they don't have a common ancestor).

## The Cortex framework

- **Cortex**: A frontend framework in charge of interpreting Evees, make their content interoperable and rendering their content in different ways.

- **Entity**: A JSON object.

- **Pattern**: A JS Class specifying a behavior or trait that can be associated to some entities. It includes a `recognize(any): boolean` function to recognize compatible entities and other, generic, functions to manipulate those entities.

- **Lens**: A [HTMLElement](https://html.spec.whatwg.org/multipage/custom-elements.html) web-component capable of rendering and interacting with a entities that are compatible with a specific pattern.

- **Source**: A service capable of retrieving content-addressable objects from their hash.

- **Provider**: A service capable of creating or modifying objects.

- **Cortex Module**: The combination of patterns, lenses, sources and providers that work together.

- **Micro-Orchestrator**: A container of JS Objects based on [InversifyJS](https://github.com/inversify/InversifyJS) around which a modular web application is build. Some of the modules in the container will be Cortex Modules.

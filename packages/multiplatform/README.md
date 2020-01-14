# @uprtcl/cortex

>_Prtcl resources: [Overview](https://github.com/uprtcl/spec/wiki), [Spec](https://github.com/uprtcl/spec), [Dev guide](https://github.com/uprtcl/js-uprtcl/wiki), [API reference](https://uprtcl.github.io/js-uprtcl/)

The **Cortex** framework: a new way to build web-applications.

At its core, Cortex does what brains do: **recognize patterns**. Its main building block is a _pattern_: a kind of object that implements certain behaviour.

Consider this example in a project management app:

- Events have their specific information and a date.
- Tasks have their own specific information and also a date.

Both types of _entity_ implement a date _pattern_.

This makes it possible to render both types of objects in a calendar element. Or maybe a Kanban board, in which some entities implement a _status pattern_. Or maybe they can be transformed to similar objects in different apps. 

This is all possible provided that we can recognize which patterns each object implements, in its own way. 

That's what Cortex does, in a generic, modular and pluggable way.

Cortex **enables**:

- Connections from the front-end to different backends, and interoperability between them
- Pattern recognition: fetch generic JSON objects and add specific behaviour to them
- Interoperability of data between applications
- Reinterpretation and transformation of applications data

Cortex is **specially tuned** for:

- Applications that use content-addressable objects in its data storage layer
- Web3 and decentralized applications
- Microservice architecture in centralized servers

## Vision

In its infancy, the web had the HTML document as its basic unit of storing information, it was designed as a documentation archive. It used links to navigate between those documents. Links address documents by location, and gives all the power of changing them to the external server owner, which stores private data from all its users.

Nowadays, the web follows a very different pattern. The basic unit of information are rows of object information stored in databases. HTML documents are just a way of displaying mostly dynamic information.

**If** we can build a way to develop generic applications that only assume relationships between content addressable content, lots of very different modules can be composed to form complex relationships of information and then...

...we can **envision a world** in which the users choose which micro modules to install in their own personalized applications to interpret and store their own data.

These are the transitions that Cortex wants to support in the web:

- "Location addressing" to "**content addressing**"
- "Computer files" to "**generic JSON objects**"
- "The server controls the data" to "**data can be transformed and stored in any platform **you** choose**"
- "Every application has to reimplement the wheel" to "**building applications by reusing frontend+backend modules already implemented**"

## Dependencies

This module depends on `@uprtcl/micro-orchestrator` to declare `MicroModule` classes, but can be used without those modules.

## Install

```bash
npm install @uprtcl/cortex
```

## Usage

Cortex modules are groups of patterns, lenses and services that are prepared to be used together.

### Using Cortex modules

Import it, configure it and load it in the `micro-orchestrator`. Example with the `@uprtcl/documents` module.

```ts
import { documentsModule, DocumentsIpfs, DocumentsBindings} from '@uprtcl/documents';

const documentsProvider = new DocumentsIpfs({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https'
});

const docs = documentsModule([documentsProvider]);

await orchestrator.loadModules({
  id: DocumentsBindings.Module,
  module: docs
});
```

### Developing a Cortex module

TBD

# \_Prtcl

[![](https://img.shields.io/npm/v/@uprtcl/micro-orchestrator)](https://www.npmjs.com/package/@uprtcl/micro-orchestrator)

This repo contains a set of tools and libraries to help develop \_Prtcl compatible web-applications.

\_Prtcl web-applications are content management applications that work eith Evees (GIT-like entities) and are built aroud reusable content rendering and manipulation modules.

> Important: these packages are under heavy development, with alpha release. Expect breaking changes.

Visit our [documentation](<(https://uprtcl.github.io/js-uprtcl)> "it's WIP, so contribution and feedback are much appreciated") to learn how to make your content-management app \_Prtcl-compatible.

### Setup for development

Clone the project, and run:

```bash
npm install
npm run bootstrap
```

### Build all packages

To build all packages, run:

```bash
npm run build
```

You might need to extend node memory allocation to build all packages using

```
export NODE_OPTIONS=--max-old-space-size=8192
```

### Run demo

To run the demo from `demos/simple-editor`. Chose which provider (type of backend) you want to test this demo at.

If you don't knoe, our OrbitDB provider should be a good choice as it will work without having to run other services.

To run the demo configured to use OrbitDB

```
cp ./lerna.web3.json ./lerna.json
cd demos/simple-editor
cp ./env.orbitdb.js ./env.js
npm run dev
```

This will configure lerna to use the web3 compatible demo app, and replace `env.js` with the provided `env.orbitdb.js` file:

Once running open http://localhost:8084.

### Hack the packages

If you want to change the code of one of our packages and have hot reload on the demo app run:

```
cd [some package folder]
npm run dev
```

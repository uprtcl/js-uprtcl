# \_Prtcl

[![](https://img.shields.io/npm/v/@uprtcl/micro-orchestrator)](https://www.npmjs.com/package/@uprtcl/micro-orchestrator)

This repo contains a set of tools and libraries to help develop \_Prtcl compatible web-applications.

\_Prtcl web-applications are content management applications that work eith Evees (GIT-like entities) and are built aroud reusable content rendering and manipulation modules.

> Important: these packages are under heavy development, with alpha release. Expect breaking changes.

Visit our [documentation](<(https://uprtcl.github.io/js-uprtcl)> "it's WIP, so contribution and feedback are much appreciated") to learn how to make your content-management app \_Prtcl-compatible.

### Run demo (OrbitDB)

To run the demo configured to use OrbitDB

Clone the project, configure lerna to work with our eb3-ready configuration and install all the dependencies:

```bash
cp ./lerna.web3.json ./lerna.json
npm install
npm run bootstrap
```

Build all packages (it takes as much as 5min):

```bash
npm run build
```

I you have memory issues while building you might need to extend node memory allocation to build all packages using

```
export NODE_OPTIONS=--max-old-space-size=8192
```

Once built, head into the demo folder and run it

```
cd demos/simple-editor
cp ./env.orbitdb.js ./env.js
npm run dev
```

This will configure lerna to use the web3 compatible demo app, and replace `env.js` with the provided `env.orbitdb.js` file:

Once running open http://localhost:8084.

You can alo run the demo with other providers (Like Ethereum, Holochain or Kusama).

### Run demo (Web2)

Deploy the backend and run it locally. Then:

```bash
cp ./lerna.web2.json ./lerna.json
npm install
npm run bootstrap
```

Build all packages (it takes as much as 5min):

```bash
npm run build
```

I you have memory issues while building you might need to extend node memory allocation to build all packages using

```
export NODE_OPTIONS=--max-old-space-size=8192
```

Once built, head into the demo folder and run it

```
cd demos/linked-thoughts
npm run dev
```

### Hack the packages

If you want to change the code of one of our packages and have hot reload on the demo app run:

```
cd [some package folder]
npm run dev
```

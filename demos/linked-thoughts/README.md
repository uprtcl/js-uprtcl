# Dev

This app relies heavily on [`js-uprtcl`](https://github.com/uprtcl/js-uprtcl).

To work on it, you should:

## Run an Ethereum local test network

You need to checkout another repo ( [`eth-uprtcl`](https://github.com/uprtcl/eth-uprtcl) and run `npm i & npm run dev` on it.

Then you need a browser with [Metamask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en) and connect it to your `localhost:8545` network (which was created by `eth-uprtcl` above).

`eth-uprtcl` runs a local testnet of the blockchain, with test accounts. You need to add one or more of these accounts to Metamask using the "Import Account" option. And pasting any one of the following private keys:

```
0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
0x6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620c
```

## (Optionally) Run the NodeJS API

If there are issues connecting with `https://api.intercreativity.io`, you can clone [js-uprtcl-server](https://github.com/uprtcl/js-uprtcl-server/tree/develop) and install it. Make sure you follow the readme there to install and run the database.

## Run the app

Then go to the `develop` branch of this repo and run

```
npm i
npm run dev
```

## Hack the app

The app uses web components from the [`js-uprtcl`](https://github.com/uprtcl/js-uprtcl) library. The most important ones are

`<wiki-drawer>` from `./modules/wikis` (@uprtcl/wikis npm package)

`<document-editor>` from `./modules/documents` (@uprtcl/documents npm package)

`<evees-info-page>` from `./modules/evees` (@uprtcl/evees npm package)

To work on those, checkout the `develop` branch of `js-uprtcl` and create an npm link from this repo @uprtcl dependencies to their corresponding folders in js-uprtcl.

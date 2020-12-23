# @uprtcl/ethereum-provider

This node package includes basic _Prtcl provider wrappers around web3. These services include standard funcionality like a retry mechanism, or a `ready()` function to wait for them to be ready.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/ethereum-provider
```

## Usage

Import the appropriate connection you would like to use, and make a new instance of it by passing its configuration:

```ts
import { EthereumConnection } from '@uprtcl/ethereum-provider';

const ethConnection = new EthereumConnection({
  provider: provider,
  contractAbi: myContractAbi
});

await ethConnection.ready();
```

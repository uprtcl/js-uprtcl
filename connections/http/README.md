# @uprtcl/http-provider

This node package includes basic \_Prtcl provider wrappers around the native fetch api. These services include standard funcionality like a retry mechanism, or a `ready()` function to wait for them to be ready.

## Documentation

Visit our [documentation site](https://uprtcl.github.io/js-uprtcl).

## Install

```bash
npm install @uprtcl/http-provider
```

## Usage

Import the appropriate connection you would like to use, and make a new instance of it by passing its configuration:

```ts
import { HttpConnection } from '@uprtcl/http-provider';

const host = 'http://localhost:3100/1';
const httpConnection = new HttpConnection();

await httpConnection.ready();
```

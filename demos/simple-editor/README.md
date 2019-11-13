# simple-editor demo

## Running the demo

### Run the ethereum backend

1. Clone the [eth-uprtcl](https://github.com/uprtcl/eth-uprtcl) to have the Ethereum backend provider running in localhost.

2. Go inside that folder, and run:

```bash
npm install
npm run dev
```

### Run `js-uprtcl-server` backend

This assumes that you have docker installed.

1. Install `dgraph` from https://docs.dgraph.io/get-started.

2. Clone the [js-uprtcl-server](https://github.com/uprtcl/js-uprtcl-server) to have the http server backend provider running in localhost.

3. Run `./run-dgraph.sh` in a background terminal.

4. Go to the root folder of `js-uprtcl-server`, and run:

```bash
npm i
npm run dev
```

### Run the frontend

1. Build the `js-uprtcl` core packages. Inside the root folder of `js-uprtcl`, run: 

```bash
npm run bootstrap
npm run build
```

2. Go inside the `demos/simple-editor` folder, and run it:

```bash
npm start
```

3. Go to `localhost:8080` and connect the browser with Metamask, with provider `localhost:8545`.

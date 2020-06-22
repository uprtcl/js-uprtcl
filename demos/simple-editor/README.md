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

- See [js-uprtcl-server](https://github.com/uprtcl/js-uprtcl-server) to have the http server backend provider running in localhost.

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

3. Go to `localhost:8082` and connect the browser with Metamask, with provider `localhost:8545`.

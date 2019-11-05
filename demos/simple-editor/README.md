# simple-editor demo

## Running the demo

### Run the ethereum backend

1. Clone the [eth-uprtcl](https://github.com/uprtcl/eth-uprtcl) to have the Ethereum backend provider running in localhost.

2. Run `ganache-cli` locally:

- If you don't have `ganache-cli` installed, run: `npm install -g ganache-cli`.
- Run in the background: `ganache-cli`.

3. Go inside that folder, and run:

```bash
npm install
npm run migrate
```

### Run the frontend

1. Build the `js-uprtcl` core packages. Inside the root folder of `js-uprtcl`, run: 

```bash
lerna bootstrap
npm run build
```

2. Go inside the `demos/simple-editor` folder, and run it:

```bash
npm start
```

3. Go to `localhost:8080` and connect the browser with Metamask, with provider `localhost:8545`.

# Robo Vault Subgraph

This is the official subgraph for the [Robo Vault](https://www.robo-vault.com/).

The subgraph is being updated and fixed constantly.

## Get Started

To get started, you need to install the dependencies:

- Using Yarn: `yarn install`
- Using NPM: `npm install`

To run tests;

1. Make sure your installed version of graph is newer than 0.22.0 using `graph --version`
2. If you don't have Postgres installed, install it; https://github.com/LimeChain/matchstick#quick-start-
3. Run `yarn prepare:mainnet` or `yarn prepare:fantom` to prepare `subgraph.yaml`.
4. Run `graph test`. Graph CLI should download and install a binary for the testing framework, [Matchstick](https://github.com/LimeChain/matchstick). Once the testing framework is set up, the tests will be run.
   If this does not work, you may need to compile Matchstick locally and run tests using `$matchstick_build_dir/matchstick` instead.

## Network Configuration

Once the smart contracts are deployed on a testnet or mainnet, the JSON files located at folder `config` must be updated.

The final **subgraph.yaml** file is used to deploy on the network.

### Configuration

Each network has a JSON file in the `./config` folder. When a deploy process is executed (using a script defined in the `package.json`), it creates the final subgraph.yaml, and deploy it to the The Graph node.

### Scripts

At this moment, the scripts available are:

- **yarn deploy:fantom:dev**: build the subgraph.yaml file, and deploy it on the Fantom network, to the dev environment
- **yarn deploy:fantom:prod**: same as above, although it pushes to the production environment

> We don't support Ethereum testnets at the moment.

## Subgraphs

The official subgraph links are:

- [Fantom Network - Dev](https://thegraph.com/hosted-service/subgraph/robovault/robo-vault-subgraph-dev)
- [Fantom Network - Prod](https://thegraph.com/hosted-service/subgraph/robovault/robo-vault-subgraph-prod)

---

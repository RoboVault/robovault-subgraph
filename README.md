# Yearn Vaults V2 Subgraph

This is the official subgraph for the Vault V2 - Yearn Protocol.

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

- **yarn deploy:fantom**: build the subgraph.yaml file, and deploy it on the Fantom network.
- **yarn deploy:mainnet**: build the subgraph.yaml file, and deploy it on the mainnet Ethereum network.

> We don't support Ethereum testnets at the moment.

## Do you want to contribute?

We currently have a multitude of needs across all of our yTeams. As the Yearn ecosystem and suite of products continue to grow, we look for new contributors to join our community as we rapidly scale.

If you are interested in working as a yearn contributor, complete [this form](https://github.com/yearn/onboarding/invitations), and a member of our operations team will reach out within 1-2 days with the next steps.

For additional information on the onboarding process, [click here](https://yearnfinance.notion.site/Contributors-bceb03566612483ca139f800fb5452ad)

## Want to Help Us In The Subgraph?

Feel free to assign an [issue](https://github.com/yearn/yearn-vaults-v2-subgraph/issues) from our current list and create a pull request. We will review it in the next 1-2 days to give you feedback about your changes.

If you want to help Yearn Finance but you need more information about this repository, schema and entities, you can read this [onboarding doc](./docs/onboarding.md).

## Subgraphs

The official subgraph links are:

- [Ethereum mainnet](https://thegraph.com/explorer/subgraph?id=0xf50b705e4eaba269dfe954f10c65bd34e6351e0c-0&version=0xf50b705e4eaba269dfe954f10c65bd34e6351e0c-0-0&view=Overview).
- [Fantom Network](https://thegraph.com/legacy-explorer/subgraph/yearn/yearn-vaults-v2-fantom)

---

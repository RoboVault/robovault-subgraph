# Yearn Subgraph

## Goals

The goal for this document is to give a profound description of the subgraph repository to allow new contributors:

- To make more accessible the onboarding process for this project.
- To understand how the subgraph works.
- To know the main concepts behind the code.

## Get's Started

The first step is to fork the repository `https://github.com/yearn/yearn-vaults-v2-subgraph.git`.

Then, clone it:

`git clone your-repo-url`

Finally, once you have cloned the repo, install the dependencies:

`yarn install`

> Unfortunately, we still didn't implement tests in the repo for our handlers. If you are available to help us, feel free to create a PR with the first tests. See more info how to start contributing [here](#Do-you-want-to-contribute)

## Important Concepts

### Naming Convention

We may use specific prefixes to indicate a particular type of value.

- total - indicates this is a cumulative value (e.g. totalSharesMinted, totalGrossReturns).
- balance - indicates this is a spot balance (e.g. balanceTokensInvested, balanceTokensIdle)
- delta - indicates this value is the difference between the prior state and the current state (e.g. deltaPricePerShare).
- current - used exclusively in **_Update_** entities. Similar to _balance_, current indicates the state of a field or value at the time of the update. These values are populated in every update whether they changed or not.
- new - used exclusively in **_Update_** entities. Fields with this prefix will only be populated if they have changed since the last Update. If there has been no change, the value will be null.

Use plurals when referring to Tokens or Shares (e.g., totalShares, balanceTokens).

### The **_Update_** Entities

When you see an entity with the `Update` prefix, it means it stores historical data.

Example: `Vault` and `VaultUpdate` entities.

Every time a transaction modifies the information in a vault, a new `VaultUpdate` row is created. Then the handler changes the `Vault.latestUpdate` field. Also, The Graph adds the new `VaultUpdate`row in the `Vault.historicalUpdates` field collection automatically by the reference `VaultUpdate.vault`.

In this case, we only create the new `VaultUpdate` item, setting the `VaultUpdate.vault` reference. We also set all the values using the previous `VaultUpdate` instance (the `Vault.latestUpdate` reference) and update the new value changed in the current transaction.

`VaultUpdate` entities contain three categories of data;

1. Data representing the value of a Vault field at the time of the update; denoted with the _current_ modifier. (e.g. currentManagementFee)
2. Data representing how the state of the Vault has been changed by the event (e.g. tokensDeposited, sharesBurnt)
3. Metadata for the update (e.g. blockNumber, transaction, vault)

### Minimal Proxies

The Vaults V2 (and some strategies) use the minimal proxy pattern.

The Graph has an issue with this pattern that invokes the call handler twice. To avoid this issue, we have a validation not to process the duplicated calls.

if you see an `if` statement like this is due to this issue:

```javascript=
if (vaultLibrary.isVault(call.to) && vaultLibrary.isVault(call.from)) {
    ...
}
```

> This issue happens only in the call handlers that we will refactor soon to support chains that don't support call handlers.

## Schema Entities

### Transaction Entity

This entity contains all the information for a given transaction. It has a field named `event`, which identifies the custom event name.

### Token Entity

This stores all the tokens used by the vaults (including yvTokens). The ID is the token address.

### TokenFee Entity

It stores the fee amount in a given token.
Each time a tracked token is transferred, it verifies whether the `to` address is a fee receiver for the given vault or not. If so, it sums the fee to the treasury or strategy fees.

TokenFee entities make a distinction between fees that have been recognized by accounting logic, and fees that have not been recognized yet. The reason is because fee revenue has to be imported by a different mapping handler than vault revenue. When the handler for vault revenue (StrategyReported) fires, it needs a way to figure out how much revenue reported by the strategy is going to eaten by fees.

More info is in the `src/utils/token-fees.ts` file.

### VaultClassification Enum

It describes the vault classification:

- Endorsed
- Experimental

### Registry Entity

This entity is our vaults registry. Every time a vault is created, the new vault is registered in this entity.

### Vault Entity

This entity is a core entity that stores all the information related to the vaults, including:

- All the history changes (updates).
- Transfers and fees.
- Withdrawals and deposits.
- And more.

### VaultUpdate Entity

It contains all the history changes for the vaults.
Every time a change is made in a given vault, a new row is created in this entity.

### Account Entity

It tracks all the information about the user interaction with the protocol.
It contains:

- All the deposits and withdrawals.
- All the vault positions.
- All the shares sent or received.

### Deposit Entity

It tracks all the deposits made by an account. It includes the shares tokens (yTokens) minted in the transaction.

### Withdraw Entity

It tracks all the withdrawals made by an account. It includes the shares tokens (yTokens) burnt in the transaction.

### Transfer Entity

It stores all the transfers for the yTokens (vaults).

### AccountVaultPosition Entity

It represents a vault position for a given account. It includes the share token, token, history changes (updates), and different balances.

### AccountVaultPositionUpdate Entity

It represents each change made by an account in its vault positions. Example:

- Deposit
- Withdraw
- Transfer

### StrategyStatus Enum

It defines whether a strategy is `Active` or `Retired`.

### Strategy Entity

This entity stores all the information related to the strategy params like ratios, reports, harvests, clone information, and health check information.

### StrategyReport Entity

It stores all the reports for all the active strategies.
It includes:

- Gain and total gain.
- Loss and total loss.
- Total debt and more.

### StrategyReportResult Entity

This entity stores the percentage rates based on the strategy reports. It also calculates the APR based on the current rate and the latest report duration.

### Harvest Entity

It stores the information about the harvests for all the strategies. It is related to the reports.

### VaultDayData Entity

Based on the Uniswap V2 subgraph entity, it aggregates some information per day and vaults.

### Yearn Entity

This entity is a global entity that stores some fee information.

## Issues

Please, if you experiment issues, feel free to create one in our [repository](https://github.com/yearn/yearn-vaults-v2-subgraph/issues).

## Questions?

I will add the most common questions from the contributors here.

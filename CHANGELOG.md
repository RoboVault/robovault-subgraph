# Change Log

All notable changes to the subgraph will be documented in this file.

## [Unreleased] - yyyy-mm-dd

### Added

### Changed

### Fixed

## [v0.0.4] - 2022-02-07

### Added

- Vault Deposit event support for vaults v0.4.4+
- Vault Withdraw event support for vaults v0.4.4+
- Added logic for Vault-centric health checks
  - Added a HealthCheck entity for Vault-centric health checks
  - Added VaultUpdate.newHealthCheck field
  - Added Vault.healthCheck field
- Added event handlers for Strategy.doHealthCheck and Strategy.healthCheck
- Add field TokenFee.unrecognizedStrategyFees this is an internal field used for VaultUpdate accounting.
- Add field TokenFee.unrecognizedTreasuryFees this is an internal field used for VaultUpdate accounting.
- Add field TokenFee.vault to make reverse lookups simpler & pave the way for tracking fees associated with multiple products.

### Changed

- AddStrategyV1/AddStrategyV2 call handlers have been replaced with Event handlers.
- VaultUpdate.managementFees has been renamed to VaultUpdate.newManagementFee. This field will only have a value set if its value has changed as part of the VaultUpdate.
- VaultUpdate.performanceFees has been renamed to VaultUpdate.newPerformanceFee. This field will only have a value set if its value has changed as part of the VaultUpdate.
- VaultUpdate.rewards has been renamed to VaultUpdate.newRewards. This field will only have a value set if its value has changed as part of the VaultUpdate.
- VaultUpdate.pricePerShare will now always have a value set.
- TokenFee.strategyFees has been renamed to TokenFee.totalStrategyFees
- TokenFee.treasuryFees has been renamed to TokenFee.totalTreasuryFees
- VaultUpdate.totalFees now denominates fees in the Vault's want token rather than the Vault's share token.

### Fixed

- Fixed an issue where VaultDayData wouldn't populate its accretive fields using the previous day's data if there had been no VaultUpdates within the previous 24 hours.
- Fixed an issue where changing performance fees, management fees, or the rewards address would permanently set one of the other respective values to zero in VaultUpdates.
- VaultUpdate.totalFees is now correctly populated.
- VaultUpdate.returnsGenerated is now populated based on the the gain/loss from StrategyReported minus strategist/treasury fees.

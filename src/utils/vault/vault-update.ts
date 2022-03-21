import { Address, BigInt, Bytes, log } from '@graphprotocol/graph-ts';
import {
  HealthCheck,
  Token,
  TokenFee,
  Transaction,
  Vault,
  VaultUpdate,
} from '../../../generated/schema';
import { BIGINT_ZERO } from '../constants';
import { updateVaultDayData } from './vault-day-data';
import { Vault as VaultContract } from '../../../generated/Registry/Vault';
import * as tokenFeeLibrary from './../token-fees';

export function buildIdFromVaultTxHashAndIndex(
  vault: string,
  transactionHash: string,
  transactionIndex: string
): string {
  return vault
    .concat('-')
    .concat(transactionHash.concat('-').concat(transactionIndex));
}

export function buildIdFromVaultAndTransaction(
  vault: Vault,
  transaction: Transaction
): string {
  return buildIdFromVaultTxHashAndIndex(
    vault.id,
    transaction.id,
    transaction.index.toString()
  );
}

function createVaultUpdate(
  id: string,
  vault: Vault,
  transaction: Transaction,
  tokensDeposited: BigInt,
  tokensWithdrawn: BigInt,
  sharesMinted: BigInt,
  sharesBurnt: BigInt,
  balancePosition: BigInt,
  returnsGenerated: BigInt,

  // These field(s) are accumulators, so they are added to the previous's VaultUpdate's value, if available.
  // Their final representation in the VaultUpdate will be as a "total" field, so:
  // totalFees(n) = totalFees(n-1)+feesPaid
  feesPaid: BigInt | null,

  newManagementFee: BigInt | null,
  newPerformanceFee: BigInt | null,
  newRewards: Address | null,
  newHealthCheck: string | null
): VaultUpdate {
  log.debug('[VaultUpdate] Creating vault update with id {}', [id]);

  let vaultUpdate = constructVaultUpdateEntity(
    id,
    transaction,
    vault,
    feesPaid
  );

  vaultUpdate.newHealthCheck = newHealthCheck;
  vaultUpdate.newManagementFee = newManagementFee;
  vaultUpdate.newPerformanceFee = newPerformanceFee;
  vaultUpdate.newRewards = newRewards;

  // Balances & Shares
  vaultUpdate.tokensDeposited = tokensDeposited;
  vaultUpdate.tokensWithdrawn = tokensWithdrawn;
  vaultUpdate.sharesMinted = sharesMinted;
  vaultUpdate.sharesBurnt = sharesBurnt;
  // Performance
  vaultUpdate.balancePosition = balancePosition;
  vaultUpdate.returnsGenerated = returnsGenerated;
  vaultUpdate.save();

  vault.latestUpdate = vaultUpdate.id;
  vault.balanceTokens = vaultUpdate.currentBalanceTokens;
  // todo: current implementation of balanceTokensIdle does not update when debt is issued to strategies
  vault.balanceTokensIdle = vault.balanceTokensIdle
    .plus(tokensDeposited)
    .minus(tokensWithdrawn);
  // todo: balanceTokensInvested
  vault.sharesSupply = vault.sharesSupply.plus(sharesMinted).minus(sharesBurnt);
  vault.save();

  updateVaultDayData(transaction, vault, vaultUpdate);

  return vaultUpdate;
}

/* This function generates a fresh VaultUpdate entity whose 'current' fields and accrued fields are populated correctly. */
function constructVaultUpdateEntity(
  id: string,
  transaction: Transaction,
  vault: Vault,
  providedFeesPaid: BigInt | null
): VaultUpdate {
  let previousVaultUpdate: VaultUpdate | null;
  if (vault.latestUpdate != null) {
    previousVaultUpdate = VaultUpdate.load(vault.latestUpdate!);
  }

  let vaultContract = VaultContract.bind(Address.fromString(vault.id));
  // Populate the totalFees parameter.
  // This field is accrued, so we're trying to add the value passed to createVaultUpdate to whatever
  // the previous accrued value was in the previous update.
  let totalFees: BigInt;

  if (!providedFeesPaid) {
    if (!previousVaultUpdate) {
      totalFees = BIGINT_ZERO;
    } else {
      totalFees = previousVaultUpdate.totalFees;
    }
  } else {
    if (!previousVaultUpdate) {
      totalFees = providedFeesPaid;
    } else {
      totalFees = previousVaultUpdate.totalFees.plus(providedFeesPaid);
    }
  }

  // Populate the following parameters based on the vault's current state.
  let pricePerShare: BigInt = vaultContract.pricePerShare();
  let balanceTokens: BigInt = vaultContract.totalAssets();

  let vaultUpdate = new VaultUpdate(id);
  vaultUpdate.totalFees = totalFees;
  vaultUpdate.pricePerShare = pricePerShare;
  vaultUpdate.currentBalanceTokens = balanceTokens;
  vaultUpdate.timestamp = transaction.timestamp;
  vaultUpdate.blockNumber = transaction.blockNumber;
  vaultUpdate.transaction = transaction.id;
  vaultUpdate.vault = vault.id;
  return vaultUpdate;
}

export function firstDeposit(
  vault: Vault,
  transaction: Transaction,
  depositedAmount: BigInt,
  sharesMinted: BigInt,
  balancePosition: BigInt,
  totalAssets: BigInt
): VaultUpdate {
  log.debug('[VaultUpdate] First deposit', []);
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);
  let vaultUpdate = VaultUpdate.load(vaultUpdateId);

  if (vaultUpdate === null) {
    vaultUpdate = createVaultUpdate(
      vaultUpdateId,
      vault,
      transaction,
      depositedAmount,
      BIGINT_ZERO, // tokensWithdrawn
      sharesMinted,
      BIGINT_ZERO, // sharesBurnt
      balancePosition,
      BIGINT_ZERO, // returnsGenerated
      null, // feesPaid
      null, // newManagementFee
      null, // newPerformanceFee
      null, // newRewards
      null // newHealthCheck
    );
  }

  return vaultUpdate;
}

export function deposit(
  vault: Vault,
  transaction: Transaction,
  depositedAmount: BigInt,
  sharesMinted: BigInt,
  balancePosition: BigInt,
  totalAssets: BigInt
): VaultUpdate {
  log.debug('[VaultUpdate] Deposit', []);
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);
  let vaultUpdate = VaultUpdate.load(vaultUpdateId);

  if (vaultUpdate === null) {
    vaultUpdate = createVaultUpdate(
      vaultUpdateId,
      vault,
      transaction,
      depositedAmount,
      BIGINT_ZERO, // TokensWithdrawn
      sharesMinted,
      BIGINT_ZERO, // SharesBurnt,
      balancePosition,
      BIGINT_ZERO, // returnsGenerated
      null, // feesPaid
      null, // newManagementFee
      null, // newPerformanceFee
      null, // newRewards
      null // newHealthCheck
    );
  }

  return vaultUpdate;
}

export function withdraw(
  vault: Vault,
  withdrawnAmount: BigInt,
  sharesBurnt: BigInt,
  transaction: Transaction,
  balancePosition: BigInt,
  totalAssets: BigInt
): VaultUpdate {
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);

  let newVaultUpdate = createVaultUpdate(
    vaultUpdateId,
    vault,
    transaction,
    BIGINT_ZERO, // TokensDeposited
    withdrawnAmount,
    BIGINT_ZERO, // SharesMinted
    sharesBurnt,
    balancePosition,
    BIGINT_ZERO, // returnsGenerated
    null, // feesPaid
    null, // newManagementFee
    null, // newPerformanceFee
    null, // newRewards
    null // newHealthCheck
  );
  return newVaultUpdate;
}

export function strategyReported(
  vault: Vault,
  transaction: Transaction,
  balancePosition: BigInt,
  grossReturnsGenerated: BigInt,
  totalAssets: BigInt
): VaultUpdate {
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);

  // Need to find netReturnsGenerated by subtracting out the fees
  let vaultContract = VaultContract.bind(Address.fromString(vault.id));
  let feeTokensToTreasury = tokenFeeLibrary.recognizeTreasuryFees(vault);
  let feeTokensToStrategist = tokenFeeLibrary.recognizeStrategyFees(vault);
  let pricePerShare = vaultContract.pricePerShare();

  let feesPaidDuringReport = feeTokensToTreasury.plus(feeTokensToStrategist);

  let netReturnsGenerated = grossReturnsGenerated.minus(feesPaidDuringReport);

  let newVaultUpdate = createVaultUpdate(
    vaultUpdateId,
    vault,
    transaction,
    BIGINT_ZERO, // TokensDeposited
    BIGINT_ZERO, // TokensWithdrawn
    BIGINT_ZERO, // SharesMinted
    BIGINT_ZERO, // SharesBurnt
    balancePosition,
    netReturnsGenerated,
    feesPaidDuringReport,
    null, // newManagementFee
    null, // newPerformanceFee
    null, // newRewards
    null // newHealthCheck
  );
  return newVaultUpdate;
}

export function performanceFeeUpdated(
  vault: Vault,
  transaction: Transaction,
  balancePosition: BigInt,
  performanceFee: BigInt,
  totalAssets: BigInt
): VaultUpdate {
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);

  let newVaultUpdate = createVaultUpdate(
    vaultUpdateId,
    vault,
    transaction,
    BIGINT_ZERO, // TokensDeposited
    BIGINT_ZERO, // TokensWithdrawn
    BIGINT_ZERO, // SharesMinted
    BIGINT_ZERO, // SharesBurnt
    balancePosition,
    BIGINT_ZERO, // returnsGenerated
    null, // feesPaid
    null, // newManagementFee
    performanceFee,
    null, // newRewards
    null // newHealthCheck
  );
  return newVaultUpdate;
}

export function managementFeeUpdated(
  vault: Vault,
  transaction: Transaction,
  balancePosition: BigInt,
  managementFee: BigInt,
  totalAssets: BigInt
): VaultUpdate {
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);

  let newVaultUpdate = createVaultUpdate(
    vaultUpdateId,
    vault,
    transaction,
    BIGINT_ZERO, // TokensDeposited
    BIGINT_ZERO, // TokensWithdrawn
    BIGINT_ZERO, // SharesMinted
    BIGINT_ZERO, // SharesBurnt
    balancePosition,
    BIGINT_ZERO, // returnsGenerated
    null, // feesPaid
    managementFee,
    null, // newPerformanceFee
    null, // newRewards
    null // newHealthCheck
  );
  return newVaultUpdate;
}

export function rewardsUpdated(
  vault: Vault,
  transaction: Transaction,
  balancePosition: BigInt,
  totalAssets: BigInt,
  rewards: Address
): VaultUpdate {
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);

  let newVaultUpdate = createVaultUpdate(
    vaultUpdateId,
    vault,
    transaction,
    BIGINT_ZERO, // TokensDeposited
    BIGINT_ZERO, // TokensWithdrawn
    BIGINT_ZERO, // SharesMinted
    BIGINT_ZERO, // SharesBurnt
    balancePosition,
    BIGINT_ZERO, // returnsGenerated
    null, // feesPaid
    null, // newManagementFee
    null, // newPerformanceFee
    rewards, // newRewards
    null // newHealthCheck
  );
  return newVaultUpdate;
}

export function healthCheckUpdated(
  vault: Vault,
  transaction: Transaction,
  healthCheck: string | null
): void {
  let vaultUpdateId = buildIdFromVaultAndTransaction(vault, transaction);
  let latestVaultUpdate: VaultUpdate | null;
  if (vault.latestUpdate !== null) {
    latestVaultUpdate = VaultUpdate.load(vault.latestUpdate!);
  }

  let newVaultUpdate = createVaultUpdate(
    vaultUpdateId,
    vault,
    transaction,
    BIGINT_ZERO, // TokensDeposited
    BIGINT_ZERO, // TokensWithdrawn
    BIGINT_ZERO, // SharesMinted
    BIGINT_ZERO, // SharesBurnt
    latestVaultUpdate!.balancePosition,
    BIGINT_ZERO, // returnsGenerated
    null, // feesPaid
    null, // newManagementFee
    null, // newPerformanceFee
    null, // newRewards
    healthCheck
  );
}

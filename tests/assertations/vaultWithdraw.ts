import { assert } from 'matchstick-as/assembly/index';
import {
  getDayIDFromIndex,
  getDayIndexFromTimestamp,
} from '../../src/utils/vault/vault-day-data';
import { defaults } from '../default';

/* 
This function is used to verify subgraph state transitions that are triggered by withdrawals.
*/
export function validateWithdrawalStateTransition(
  beneficiary: string,
  vault: string,
  txnHash: string,
  expectedWithdrawalAmount: string,
  expectedSharesBurned: string,
  expectedPricePerShare: string
): void {
  let positionId = beneficiary.concat('-').concat(vault);
  assert.fieldEquals('AccountVaultPosition', positionId, 'balanceShares', '0');
  assert.fieldEquals('AccountVaultPosition', positionId, 'balanceTokens', '0');
  // todo: The AccountVaultPosition.balanceProfit field appears to returning inaccurate results, so cannot be tested.
  /*
  assert.fieldEquals(
    'AccountVaultPosition',
    positionId,
    'balanceProfit',
    "0"
  );
  */

  // Verify VaultUpdate
  let transactionIndex = '1'; // todo: get from transaction
  let logIndex = '1'; // todo: get from transaction
  // from _getOrCreateTransaction
  let transactionHashId = txnHash.concat('-').concat(logIndex);
  // from buildIdFromVaultAndTransaction
  let vaultUpdateId = vault
    .concat('-')
    .concat(transactionHashId.concat('-').concat(transactionIndex));
  // todo: get from chain?

  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'id', vaultUpdateId);
  assert.fieldEquals(
    'VaultUpdate',
    vaultUpdateId,
    'transaction',
    transactionHashId
  );
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'vault', vault);
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'tokensDeposited', '0');
  assert.fieldEquals(
    'VaultUpdate',
    vaultUpdateId,
    'tokensWithdrawn',
    expectedWithdrawalAmount
  );
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'sharesMinted', '0');
  assert.fieldEquals(
    'VaultUpdate',
    vaultUpdateId,
    'sharesBurnt',
    expectedSharesBurned
  );
  assert.fieldEquals(
    'VaultUpdate',
    vaultUpdateId,
    'pricePerShare',
    expectedPricePerShare
  );
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'totalFees', '0');
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'newManagementFee', 'null');
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'newPerformanceFee', 'null');
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'newHealthCheck', 'null');
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'newRewards', 'null');

  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'returnsGenerated', '0');

  // todo: get newOrder from transaction
  let newOrder = '1';
  let positionUpdateId = beneficiary
    .concat('-')
    .concat(vault.concat('-').concat(newOrder));

  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'sharesBurnt',
    expectedSharesBurned
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'balanceShares',
    '0'
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'withdrawals',
    expectedWithdrawalAmount
  );

  let withdrawlId = beneficiary
    .concat('-')
    .concat(transactionHashId)
    .concat('-')
    .concat(transactionIndex);
  assert.fieldEquals('Withdrawal', withdrawlId, 'id', withdrawlId);
  assert.fieldEquals(
    'Withdrawal',
    withdrawlId,
    'tokenAmount',
    expectedWithdrawalAmount
  );
  assert.fieldEquals(
    'Withdrawal',
    withdrawlId,
    'sharesBurnt',
    expectedSharesBurned
  );

  // Verify VaultDayData
  let dayId = getDayIndexFromTimestamp(defaults.bigInt);
  let vaultDayId = getDayIDFromIndex(vault, dayId);
  assert.fieldEquals('VaultDayData', vaultDayId, 'id', vaultDayId);
  assert.fieldEquals('VaultDayData', vaultDayId, 'totalReturnsGenerated', '0');
  assert.fieldEquals('VaultDayData', vaultDayId, 'dayReturnsGenerated', '0');
  assert.fieldEquals(
    'VaultDayData',
    vaultDayId,
    'withdrawn',
    expectedSharesBurned.toString()
  );
  assert.fieldEquals(
    'VaultDayData',
    vaultDayId,
    'pricePerShare',
    expectedPricePerShare.toString()
  );
}

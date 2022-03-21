import { assert } from 'matchstick-as/assembly/index';
import {
  getDayIDFromIndex,
  getDayIndexFromTimestamp,
} from '../../src/utils/vault/vault-day-data';
import { defaults } from '../default';

/* 
This function is used to verify subgraph state transitions that are triggered by deposits.
*/
export function validateDepositStateTransition(
  beneficiary: string,
  vault: string,
  wantToken: string,
  txnHash: string,
  expectedDepositAmount: string,
  expectedSharesMinted: string,
  expectedPricePerShare: string
): void {
  assert.fieldEquals('Account', beneficiary, 'id', beneficiary);

  // Verify an AccountPosition exists and has the correct balances
  let positionId = beneficiary.concat('-').concat(vault);
  assert.fieldEquals(
    'AccountVaultPosition',
    positionId,
    'account',
    beneficiary
  );
  assert.fieldEquals('AccountVaultPosition', positionId, 'vault', vault);
  assert.fieldEquals('AccountVaultPosition', positionId, 'token', wantToken);
  assert.fieldEquals(
    'AccountVaultPosition',
    positionId,
    'balanceShares',
    expectedSharesMinted
  );
  assert.fieldEquals(
    'AccountVaultPosition',
    positionId,
    'balanceTokens',
    expectedDepositAmount
  );

  // Verify VaultPositionUpdate exists and is correct
  // todo: get newOrder from transaction
  let newOrder = '0';
  let positionUpdateId = beneficiary
    .concat('-')
    .concat(vault.concat('-').concat(newOrder));
  assert.fieldEquals(
    'AccountVaultPosition',
    positionId,
    'latestUpdate',
    positionUpdateId
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'id',
    positionUpdateId
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'account',
    beneficiary
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'accountVaultPosition',
    positionId
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'deposits',
    expectedDepositAmount
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'withdrawals',
    '0'
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'sharesMinted',
    expectedSharesMinted
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'sharesBurnt',
    '0'
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'sharesSent',
    '0'
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'sharesReceived',
    '0'
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'tokensSent',
    '0'
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'tokensReceived',
    '0'
  );
  assert.fieldEquals(
    'AccountVaultPositionUpdate',
    positionUpdateId,
    'balanceShares',
    expectedSharesMinted
  );

  // Verify VaultUpdate
  let transactionIndex = '1'; // todo: get from transaction
  let logIndex = '1'; // todo: get from transaction
  // from _getOrCreateTransaction
  let transactionHashId = txnHash.concat('-').concat(logIndex);
  // from buildIdFromVaultAndTransaction
  let vaultUpdateId = vault
    .concat('-')
    .concat(transactionHashId.concat('-').concat(transactionIndex));

  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'id', vaultUpdateId);
  assert.fieldEquals(
    'VaultUpdate',
    vaultUpdateId,
    'transaction',
    transactionHashId
  );
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'vault', vault);
  assert.fieldEquals(
    'VaultUpdate',
    vaultUpdateId,
    'tokensDeposited',
    expectedDepositAmount
  );
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'tokensWithdrawn', '0');
  assert.fieldEquals(
    'VaultUpdate',
    vaultUpdateId,
    'sharesMinted',
    expectedSharesMinted
  );
  assert.fieldEquals('VaultUpdate', vaultUpdateId, 'sharesBurnt', '0');
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

  assert.fieldEquals('Vault', vault, 'latestUpdate', vaultUpdateId);

  // Verify Deposit
  // from deposit.buildIdFromAccountHashAndIndex
  let depositId = beneficiary
    .concat('-')
    .concat(transactionHashId)
    .concat('-')
    .concat(transactionIndex);
  assert.fieldEquals('Deposit', depositId, 'id', depositId);
  assert.fieldEquals('Deposit', depositId, 'account', beneficiary);
  assert.fieldEquals('Deposit', depositId, 'vault', vault);
  assert.fieldEquals(
    'Deposit',
    depositId,
    'tokenAmount',
    expectedDepositAmount
  );
  assert.fieldEquals(
    'Deposit',
    depositId,
    'sharesMinted',
    expectedSharesMinted
  );
  assert.fieldEquals('Deposit', depositId, 'transaction', transactionHashId);

  // Verify VaultDayData
  let dayId = getDayIndexFromTimestamp(defaults.bigInt);
  let vaultDayId = getDayIDFromIndex(vault, dayId);
  assert.fieldEquals('VaultDayData', vaultDayId, 'id', vaultDayId);
  assert.fieldEquals('VaultDayData', vaultDayId, 'totalReturnsGenerated', '0');
  assert.fieldEquals('VaultDayData', vaultDayId, 'dayReturnsGenerated', '0');
  assert.fieldEquals(
    'VaultDayData',
    vaultDayId,
    'deposited',
    expectedSharesMinted.toString()
  );
  assert.fieldEquals(
    'VaultDayData',
    vaultDayId,
    'pricePerShare',
    expectedPricePerShare.toString()
  );
}

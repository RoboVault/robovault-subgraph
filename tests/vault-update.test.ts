import { clearStore, test, assert } from 'matchstick-as/assembly/index';
import {
  Address,
  log,
  BigInt,
  Bytes,
  ByteArray,
  ethereum,
} from '@graphprotocol/graph-ts';
import { createRegistryV1Entity } from './util/registryEvents';
import {
  createMockAddStrategyV1Event,
  createMockNewVaultEvent,
  createMockStrategyReported_v3_0_v3_1_Event,
} from './util/vaultEvents';
import { createMockTransferEvent } from './util/erc20Events';
import {
  handleStrategyReported_v0_3_0_v0_3_1,
  handleStrategyAddedV1,
  handleTransfer,
} from '../src/mappings/vaultMappings';
import { handleHarvested } from '../src/mappings/strategyMappings';

import { CreateMockUSDCVault_1 } from './fixtures/CreateMockUSDCVault_1';
import { AddStrategyToUSDCVault_2 } from './fixtures/AddStrategyToUSDCVault_2';
import { HarvestStrategy_4 } from './fixtures/HarvestStrategy_4';
import { handleNewVaultInner } from '../src/mappings/registryMappings';
import {
  Account,
  Strategy as StrategySchema,
  TokenFee,
  Transaction,
  Transfer,
  Vault,
} from '../generated/schema';
import { buildIdFromEvent } from '../src/utils/commons';
import { BIGINT_ZERO, ZERO_ADDRESS } from '../src/utils/constants';
import { defaults } from './default';
import { buildIdFromAccountToAccountAndTransaction } from '../src/utils/transfer';
import { getDayIDFromIndex } from '../src/utils/vault/vault-day-data';

let registry_address = Address.fromString(
  '0xa0c1a2ea0a861a967d9d0ffe2ae4012c2e053804'
);

test('handleTransfer Event + Strategist Fee Recognition', () => {
  // setup environment from scratch
  clearStore();
  CreateMockUSDCVault_1.mockChainState();
  let vaultAddress = CreateMockUSDCVault_1.VaultAddress;
  let wantTokenAddress = CreateMockUSDCVault_1.WantTokenAddress;
  let apiVersion = '0.3.0';
  let mockEvent = createMockNewVaultEvent(
    Address.fromString(wantTokenAddress),
    1,
    Address.fromString(vaultAddress),
    apiVersion
  );
  handleNewVaultInner(registry_address, mockEvent);
  AddStrategyToUSDCVault_2.mockChainState();
  let strategyAddress = AddStrategyToUSDCVault_2.StrategyAddress;
  let debtLimit = '9500';
  let rateLimit = '2000000000000';
  let performanceFee = '1000';
  let mockAddStrategyEvent = createMockAddStrategyV1Event(
    Address.fromString(strategyAddress),
    Address.fromString(vaultAddress),
    debtLimit,
    rateLimit,
    performanceFee
  );

  handleStrategyAddedV1(mockAddStrategyEvent);
  HarvestStrategy_4.mockChainState();

  // the following tests all build off of the same transaction:
  // https://etherscan.io/tx/0x03810d161c9d156415b307e4bc72ede7e3b2df801c8160ce6c4e5ba8e7d9a4c7#eventlog
  // Each test generates entities that are used by tests that come after, so we won't be calling clearStore() between tests.
  let strategistPayment = '3304563';
  let usdcPaymentValue = '3304410'; // this can be derived from (shares * totalAssets) / totalSupply in the future
  let stratPaymentEventIndex = '50';
  let strategistPaymentEvent = createMockTransferEvent(
    vaultAddress,
    vaultAddress,
    strategyAddress,
    strategistPayment,
    stratPaymentEventIndex
  );
  handleTransfer(strategistPaymentEvent);

  let vaultAccount = Account.load(vaultAddress);
  assert.assertNotNull(vaultAccount);
  let strategistAccount = Account.load(strategyAddress);
  assert.assertNotNull(strategistAccount);

  let txnHash = defaults.addressBytes.toHexString();
  let transaction = Transaction.load(
    txnHash.concat('-').concat(stratPaymentEventIndex)
  );
  assert.assertNotNull(transaction);
  let transferId = buildIdFromAccountToAccountAndTransaction(
    vaultAccount!,
    strategistAccount!,
    transaction!
  );
  let transfer = Transfer.load(transferId);
  assert.assertNotNull(transfer);

  assert.fieldEquals('Transfer', transferId, 'from', vaultAccount!.id);
  assert.fieldEquals('Transfer', transferId, 'to', strategistAccount!.id);
  assert.fieldEquals('Transfer', transferId, 'vault', vaultAddress);
  assert.fieldEquals('Transfer', transferId, 'shareAmount', strategistPayment);
  assert.fieldEquals('Transfer', transferId, 'tokenAmount', usdcPaymentValue);
  // note: tokenAmountUSDC cannot be tested here because block height <12198044
  assert.fieldEquals('Transfer', transferId, 'isFeeToTreasury', 'false');
  assert.fieldEquals('Transfer', transferId, 'isFeeToStrategy', 'true');

  // now test TokenFee
  assert.fieldEquals('TokenFee', vaultAddress, 'id', vaultAddress);
  assert.fieldEquals('TokenFee', vaultAddress, 'token', wantTokenAddress);
  assert.fieldEquals('TokenFee', vaultAddress, 'totalFees', '0');
  assert.fieldEquals('TokenFee', vaultAddress, 'totalTreasuryFees', '0');
  assert.fieldEquals('TokenFee', vaultAddress, 'totalStrategyFees', '0');
  assert.fieldEquals('TokenFee', vaultAddress, 'unrecognizedTreasuryFees', '0');
  assert.fieldEquals(
    'TokenFee',
    vaultAddress,
    'unrecognizedStrategyFees',
    usdcPaymentValue
  );
});

test('handleTransfer Event + Treasury Fee Recognition', () => {
  // reuse environment
  let vaultAddress = HarvestStrategy_4.VaultAddress;
  let treasuryAddress = HarvestStrategy_4.TreasuryAddress;
  let wantTokenAddress = HarvestStrategy_4.WantTokenAddress;
  let treasuryPayment = '16570558';
  let usdcPaymentValue = '16569793'; // this can be derived from (shares * totalAssets) / totalSupply in the future
  let prevStrategistPaymentUSDC = '3304410';
  let treasuryPaymentEventIndex = '51';
  let treasuryPaymentEvent = createMockTransferEvent(
    vaultAddress,
    vaultAddress,
    treasuryAddress,
    treasuryPayment,
    treasuryPaymentEventIndex
  );
  handleTransfer(treasuryPaymentEvent);

  let vaultAccount = Account.load(vaultAddress);
  assert.assertNotNull(vaultAccount);

  let treasuryAccount = Account.load(treasuryAddress);
  assert.assertNotNull(treasuryAccount);

  let txnHash = defaults.addressBytes.toHexString();
  let transaction = Transaction.load(
    txnHash.concat('-').concat(treasuryPaymentEventIndex)
  );
  assert.assertNotNull(transaction);
  let transferId = buildIdFromAccountToAccountAndTransaction(
    vaultAccount!,
    treasuryAccount!,
    transaction!
  );
  let transfer = Transfer.load(transferId);
  assert.assertNotNull(transfer);

  assert.fieldEquals('Transfer', transferId, 'from', vaultAccount!.id);
  assert.fieldEquals('Transfer', transferId, 'to', treasuryAccount!.id);
  assert.fieldEquals('Transfer', transferId, 'vault', vaultAddress);
  assert.fieldEquals('Transfer', transferId, 'shareAmount', treasuryPayment);
  assert.fieldEquals('Transfer', transferId, 'tokenAmount', usdcPaymentValue);
  // note: tokenAmountUSDC cannot be tested here because block height <12198044
  assert.fieldEquals('Transfer', transferId, 'isFeeToTreasury', 'true');
  assert.fieldEquals('Transfer', transferId, 'isFeeToStrategy', 'false');

  // now test TokenFee
  assert.fieldEquals('TokenFee', vaultAddress, 'id', vaultAddress);
  assert.fieldEquals('TokenFee', vaultAddress, 'token', wantTokenAddress);
  assert.fieldEquals('TokenFee', vaultAddress, 'totalFees', '0');
  assert.fieldEquals('TokenFee', vaultAddress, 'totalTreasuryFees', '0');
  assert.fieldEquals('TokenFee', vaultAddress, 'totalStrategyFees', '0');
  assert.fieldEquals(
    'TokenFee',
    vaultAddress,
    'unrecognizedTreasuryFees',
    usdcPaymentValue
  );
  assert.fieldEquals(
    'TokenFee',
    vaultAddress,
    'unrecognizedStrategyFees',
    prevStrategistPaymentUSDC
  );
});

test('StrategyReported generates a VaultUpdate with correct recognized profit.', () => {
  // reuse environment
  let vaultAddress = HarvestStrategy_4.VaultAddress;
  let strategyAddress = HarvestStrategy_4.StrategyAddress;
  let wantTokenAddress = HarvestStrategy_4.WantTokenAddress;
  let strategyReportedEventIndex = '53';
  let gain = '33043378';
  let loss = '0';
  let totalGain = '33043378';
  let totalLoss = '0';
  let totalDebt = '559944200575';
  let debtAdded = '398061966813';
  let debtLimit = '9500';
  let unrecognizedStrategistFees = '3304410';
  let unrecognizedTreasuryFees = '16569793';
  let totalFees = BigInt.fromString(unrecognizedStrategistFees).plus(
    BigInt.fromString(unrecognizedTreasuryFees)
  );
  let strategyReportedEvent = createMockStrategyReported_v3_0_v3_1_Event(
    defaults.addressBytes.toHexString(),
    Address.fromString(vaultAddress),
    Address.fromString(strategyAddress),
    BigInt.fromString(gain),
    BigInt.fromString(loss),
    BigInt.fromString(totalGain),
    BigInt.fromString(totalLoss),
    BigInt.fromString(totalDebt),
    BigInt.fromString(debtAdded),
    BigInt.fromString(debtLimit)
  );

  handleStrategyReported_v0_3_0_v0_3_1(strategyReportedEvent);
  let strategyReportedId = buildIdFromEvent(strategyReportedEvent);
  assert.fieldEquals(
    'StrategyReport',
    strategyReportedId,
    'id',
    strategyReportedId
  );

  // validate that fees have been recognized by accounting
  assert.fieldEquals('TokenFee', vaultAddress, 'unrecognizedTreasuryFees', '0');
  assert.fieldEquals('TokenFee', vaultAddress, 'unrecognizedStrategyFees', '0');
  assert.fieldEquals(
    'TokenFee',
    vaultAddress,
    'totalTreasuryFees',
    unrecognizedTreasuryFees
  );
  assert.fieldEquals(
    'TokenFee',
    vaultAddress,
    'totalStrategyFees',
    unrecognizedStrategistFees
  );
  assert.fieldEquals(
    'TokenFee',
    vaultAddress,
    'totalFees',
    totalFees.toString()
  );

  // now check VaultUpdate
  let returns = BigInt.fromString(gain).minus(totalFees);

  let vault = Vault.load(vaultAddress);
  let latestUpdate = vault!.latestUpdate;
  assert.assertNotNull(latestUpdate);

  assert.fieldEquals(
    'VaultUpdate',
    latestUpdate!,
    'returnsGenerated',
    returns.toString()
  );
  assert.fieldEquals(
    'VaultUpdate',
    latestUpdate!,
    'totalFees',
    totalFees.toString()
  );

  // make sure the values bubbled up into VaultDayData correctly
  let vaultDayId = getDayIDFromIndex(vaultAddress, BIGINT_ZERO);
  assert.fieldEquals('VaultDayData', vaultDayId, 'id', vaultDayId);
  assert.fieldEquals(
    'VaultDayData',
    vaultDayId,
    'totalReturnsGenerated',
    returns.toString()
  );
  assert.fieldEquals(
    'VaultDayData',
    vaultDayId,
    'dayReturnsGenerated',
    returns.toString()
  );
  // cannot test usdc fields since this block is <12198044
});

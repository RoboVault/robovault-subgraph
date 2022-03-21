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
import {
  createMockHarvestedEvent,
  createMockSetDoHealthCheckEvent,
  createMockSetHealthCheckEvent,
} from './util/strategyEvents';
import {
  handleStrategyReported_v0_3_0_v0_3_1,
  handleStrategyAddedV1,
} from '../src/mappings/vaultMappings';
import {
  handleHarvested,
  handleSetHealthCheckEvent,
  handleSetDoHealthCheckEvent,
} from '../src/mappings/strategyMappings';

import { CreateMockUSDCVault_1 } from './fixtures/CreateMockUSDCVault_1';
import { AddStrategyToUSDCVault_2 } from './fixtures/AddStrategyToUSDCVault_2';
import { HarvestStrategy_4 } from './fixtures/HarvestStrategy_4';
import { handleNewVaultInner } from '../src/mappings/registryMappings';
import { Strategy as StrategySchema } from '../generated/schema';
import { buildIdFromEvent } from '../src/utils/commons';

let registry_address = Address.fromString(
  '0xa0c1a2ea0a861a967d9d0ffe2ae4012c2e053804'
);

test('Can add a strategy to a vault using handleAddStrategyV1 (call)', () => {
  // setup the subgraph state
  let registry = createRegistryV1Entity(registry_address);
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

  // actually start the test now
  AddStrategyToUSDCVault_2.mockChainState();
  let strategyAddress = AddStrategyToUSDCVault_2.StrategyAddress;

  // from https://etherscan.io/tx/0x3e059ed2652468576e10ea90bc1c3fcf2f125bbdb31c2f9063cb5108c68e1c59#eventlog
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

  let strategy = StrategySchema.load(strategyAddress);
  assert.assertNotNull(strategy);
  log.info('[TEST] Strategy built successfully', []);

  assert.fieldEquals('Strategy', strategyAddress, 'vault', vaultAddress);
});

test('handleHarvested (event)', () => {
  HarvestStrategy_4.mockChainState();
  let vaultAddress = HarvestStrategy_4.VaultAddress;
  let strategyAddress = HarvestStrategy_4.StrategyAddress;

  // from https://etherscan.io/tx/0x03810d161c9d156415b307e4bc72ede7e3b2df801c8160ce6c4e5ba8e7d9a4c7#eventlog
  let txnHash =
    '0x03810d161c9d156415b307e4bc72ede7e3b2df801c8160ce6c4e5ba8e7d9a4c7';
  let profit = '33043378';
  let loss = '0';
  let debtPayment = '0';
  let debtOutstanding = '0';

  let harvestedEvent = createMockHarvestedEvent(
    txnHash,
    Address.fromString(strategyAddress),
    BigInt.fromString(profit),
    BigInt.fromString(loss),
    BigInt.fromString(debtPayment),
    BigInt.fromString(debtOutstanding)
  );
  handleHarvested(harvestedEvent);

  let txnIndex = '1';
  let harvestId = strategyAddress
    .concat('-')
    .concat(txnHash)
    .concat('-')
    .concat(txnIndex);

  assert.fieldEquals('Harvest', harvestId, 'id', harvestId);
  assert.fieldEquals('Harvest', harvestId, 'profit', profit);
  assert.fieldEquals('Harvest', harvestId, 'loss', loss);
  assert.fieldEquals('Harvest', harvestId, 'debtPayment', debtPayment);
  assert.fieldEquals('Harvest', harvestId, 'debtOutstanding', debtOutstanding);
});

test('StrategyReported_v0_3_0_v0_3_1 (event)', () => {
  // from https://etherscan.io/tx/0x03810d161c9d156415b307e4bc72ede7e3b2df801c8160ce6c4e5ba8e7d9a4c7#eventlog
  let txnHash =
    '0x03810d161c9d156415b307e4bc72ede7e3b2df801c8160ce6c4e5ba8e7d9a4c7';
  let gain = '33043378';
  let loss = '0';
  let totalGain = '33043378';
  let totalLoss = '0';
  let totalDebt = '559944200575';
  let debtAdded = '398061966813';
  let debtLimit = '9500';
  // we're still on HarvestStrategy_4's chain state
  let strategyAddress = HarvestStrategy_4.StrategyAddress;
  let vaultAddress = HarvestStrategy_4.VaultAddress;
  let strategyReportedEvent = createMockStrategyReported_v3_0_v3_1_Event(
    txnHash,
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
  assert.fieldEquals('StrategyReport', strategyReportedId, 'gain', gain);
  assert.fieldEquals('StrategyReport', strategyReportedId, 'loss', loss);
  assert.fieldEquals(
    'StrategyReport',
    strategyReportedId,
    'totalGain',
    totalGain
  );
  assert.fieldEquals(
    'StrategyReport',
    strategyReportedId,
    'totalLoss',
    totalLoss
  );
  assert.fieldEquals(
    'StrategyReport',
    strategyReportedId,
    'totalDebt',
    totalDebt
  );
  assert.fieldEquals(
    'StrategyReport',
    strategyReportedId,
    'debtAdded',
    debtAdded
  );
});

test('SetHealthCheck (event)', () => {
  // This event doesn't actually happen at this block height for this strategy,
  // but fortunately we don't need to query the on-chain state to test this event handler.
  let strategyAddress = HarvestStrategy_4.StrategyAddress;
  let healthCheckAddress = '0x000000000000000000000000000000000000dead';
  let setHealthCheckEvent = createMockSetHealthCheckEvent(
    strategyAddress,
    healthCheckAddress
  );

  handleSetHealthCheckEvent(setHealthCheckEvent);

  assert.fieldEquals(
    'Strategy',
    strategyAddress,
    'healthCheck',
    healthCheckAddress
  );
});

test('SetDoHealthCheck (event)', () => {
  // This event doesn't actually happen at this block height for this strategy,
  // but fortunately we don't need to query the on-chain state to test this event handler.
  let strategyAddress = HarvestStrategy_4.StrategyAddress;

  let enableHealthCheckEvent = createMockSetDoHealthCheckEvent(
    strategyAddress,
    true
  );
  handleSetDoHealthCheckEvent(enableHealthCheckEvent);

  assert.fieldEquals('Strategy', strategyAddress, 'doHealthCheck', 'true');

  let disableHealthCheckEvent = createMockSetDoHealthCheckEvent(
    strategyAddress,
    false
  );
  handleSetDoHealthCheckEvent(disableHealthCheckEvent);
  assert.fieldEquals('Strategy', strategyAddress, 'doHealthCheck', 'false');
});

clearStore();

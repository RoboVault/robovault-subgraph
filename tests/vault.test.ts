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
  createMockDeposit1Call,
  createMockDepositCall,
  createMockWithdraw1Call,
} from './util/vaultCalls';
import {
  createMockAddStrategyV1Event,
  createMockDepositEvent,
  createMockNewVaultEvent,
  createMockUpdateManagementFeeEvent,
  createMockUpdatePerformanceFeeEvent,
  createMockUpdateRewardsEvent,
  createMockWithdrawEvent,
} from './util/vaultEvents';
import {
  handleDeposit,
  handleWithdrawWithShares,
  handleStrategyAddedV1,
  handleStrategyAddedV2,
  handleWithdrawEvent,
  handleDepositEvent,
  handleUpdatePerformanceFee,
  handleUpdateManagementFee,
  handleUpdateRewards,
} from '../src/mappings/vaultMappings';
import { CreateMockUSDCVault_1 } from './fixtures/CreateMockUSDCVault_1';
import { AddStrategyToUSDCVault_2 } from './fixtures/AddStrategyToUSDCVault_2';
import { DepositToVaultWithSpecAmount_3 } from './fixtures/DepositToVaultWithSpecAmount_3';
import { WithdrawFromVaultWithSpecAmount_4 } from './fixtures/WithdrawFromVaultWithSpecAmount_4';
import { handleNewVaultInner } from '../src/mappings/registryMappings';
import {
  Vault as VaultSchema,
  Deposit as DepositSchema,
  Strategy as StrategySchema,
  VaultUpdate as VaultUpdateSchema,
} from '../generated/schema';
import { validateDepositStateTransition } from './assertations/vaultDeposit';
import { validateWithdrawalStateTransition } from './assertations/vaultWithdraw';
import { createMockedFunction } from 'matchstick-as';
import { defaults } from './default';

let registry_address = Address.fromString(
  '0xa0c1a2ea0a861a967d9d0ffe2ae4012c2e053804'
);

test('Can create registry via NewRelease event', () => {
  let registry = createRegistryV1Entity(registry_address);
  assert.assertNotNull(registry);
});

test('Can create a Vault entity via NewVault event', () => {
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
  log.info('[TEST] Calling handleNewVaultInner with mocked event', []);
  handleNewVaultInner(registry_address, mockEvent);

  let vault = VaultSchema.load(vaultAddress);

  assert.assertNotNull(vault);
  assert.fieldEquals(
    'Vault',
    vaultAddress,
    'registry',
    registry_address.toHexString()
  );
});

test('Can perform an initial deposit into a Vault using a deposit1 (call)', () => {
  DepositToVaultWithSpecAmount_3.mockChainState();
  // from DepositToVaultWithSpecAmount_3
  let depositor = DepositToVaultWithSpecAmount_3.DepositorAddress;
  let vaultAddress = DepositToVaultWithSpecAmount_3.VaultAddress;
  let wantAddress = DepositToVaultWithSpecAmount_3.WantTokenAddress;
  let amount = '79056085';
  let txnHash =
    '0xc1c33bd1a42e6c57134275be180376ef79d4e3b5a09162640ea3d01fb96e8ce6';

  let mockCall = createMockDepositCall(
    Bytes.fromByteArray(ByteArray.fromHexString(txnHash)),
    Address.fromString(vaultAddress),
    Address.fromString(depositor),
    BigInt.fromString(amount)
  );
  handleDeposit(mockCall);

  // @ts-ignore
  let pricePerShare = BigInt.fromString('10').pow(u8(6));
  validateDepositStateTransition(
    depositor,
    vaultAddress,
    wantAddress,
    txnHash,
    amount,
    amount,
    pricePerShare.toString()
  );
});

test('Can perform a withdrawl from a Vault using withdraw (amount) (call)', () => {
  WithdrawFromVaultWithSpecAmount_4.mockChainState();
  let vaultAddress = WithdrawFromVaultWithSpecAmount_4.VaultAddress;
  let depositor = WithdrawFromVaultWithSpecAmount_4.DepositorAddress;
  let txnHash =
    '0xfbe5fe8f992480569f67f96dc35af74dfd38b0c20cae2e7cd9d949d9629e997b';
  let amount = '79056085';

  let mockCall = createMockWithdraw1Call(
    Bytes.fromByteArray(ByteArray.fromHexString(txnHash)),
    Address.fromString(vaultAddress),
    Address.fromString(depositor),
    BigInt.fromString(amount),
    BigInt.fromString(amount)
  );
  handleWithdrawWithShares(mockCall);

  // @ts-ignore
  let pricePerShare = BigInt.fromString('10').pow(u8(6));

  validateWithdrawalStateTransition(
    depositor,
    vaultAddress,
    txnHash,
    amount,
    amount,
    pricePerShare.toString()
  );
});

test('Can perform an initial deposit into a Vault using a deposit event', () => {
  // setup the environment from scratch
  clearStore();
  createRegistryV1Entity(registry_address);
  CreateMockUSDCVault_1.mockChainState();
  AddStrategyToUSDCVault_2.mockChainState();
  DepositToVaultWithSpecAmount_3.mockChainState();

  let depositor = DepositToVaultWithSpecAmount_3.DepositorAddress;
  let vaultAddress = DepositToVaultWithSpecAmount_3.VaultAddress;
  let wantAddress = DepositToVaultWithSpecAmount_3.WantTokenAddress;
  let amount = '79056085';
  let txnHash =
    '0xc1c33bd1a42e6c57134275be180376ef79d4e3b5a09162640ea3d01fb96e8ce6';

  let mockEvent = createMockDepositEvent(
    Bytes.fromByteArray(ByteArray.fromHexString(txnHash)),
    Address.fromString(vaultAddress),
    Address.fromString(depositor),
    BigInt.fromString(amount),
    BigInt.fromString(amount)
  );

  handleDepositEvent(mockEvent);

  // @ts-ignore
  let pricePerShare = BigInt.fromString('10').pow(u8(6));

  validateDepositStateTransition(
    depositor,
    vaultAddress,
    wantAddress,
    txnHash,
    amount,
    amount,
    pricePerShare.toString()
  );
});

test('Can perform an initial withdraw from a Vault using a withdraw event', () => {
  WithdrawFromVaultWithSpecAmount_4.mockChainState();
  let vaultAddress = WithdrawFromVaultWithSpecAmount_4.VaultAddress;
  let beneficiary = WithdrawFromVaultWithSpecAmount_4.DepositorAddress;
  let txnHash =
    '0xfbe5fe8f992480569f67f96dc35af74dfd38b0c20cae2e7cd9d949d9629e997b';
  let amount = '79056085';

  let mockEvent = createMockWithdrawEvent(
    Bytes.fromByteArray(ByteArray.fromHexString(txnHash)),
    Address.fromString(vaultAddress),
    Address.fromString(beneficiary),
    BigInt.fromString(amount),
    BigInt.fromString(amount)
  );

  handleWithdrawEvent(mockEvent);

  // @ts-ignore
  let pricePerShare = BigInt.fromString('10').pow(u8(6));

  validateWithdrawalStateTransition(
    beneficiary,
    vaultAddress,
    txnHash,
    amount,
    amount,
    pricePerShare.toString()
  );
});

test('Deposit call handlers shouldnt fire if Vault apiVersion > 0.4.3', () => {
  // setup the environment from scratch
  clearStore();
  createRegistryV1Entity(registry_address);
  CreateMockUSDCVault_1.mockChainState();
  AddStrategyToUSDCVault_2.mockChainState();
  DepositToVaultWithSpecAmount_3.mockChainState();
  let vaultAddress = DepositToVaultWithSpecAmount_3.VaultAddress;
  // we need to override the Fixture's apiVersion to 0.4.4
  createMockedFunction(
    Address.fromString(vaultAddress),
    'apiVersion',
    'apiVersion():(string)' // @ts-ignore
  ).returns([ethereum.Value.fromString('0.4.4')]);

  let depositor = DepositToVaultWithSpecAmount_3.DepositorAddress;
  let amount = '79056085';
  let txnHash =
    '0xc1c33bd1a42e6c57134275be180376ef79d4e3b5a09162640ea3d01fb96e8ce6';

  let mockCall = createMockDepositCall(
    Bytes.fromByteArray(ByteArray.fromHexString(txnHash)),
    Address.fromString(vaultAddress),
    Address.fromString(depositor),
    BigInt.fromString(amount)
  );
  handleDeposit(mockCall);

  let transactionHashId = txnHash
    .concat('-')
    .concat(defaults.bigInt.toString());
  let depositId = depositor
    .concat('-')
    .concat(transactionHashId)
    .concat('-')
    .concat(defaults.bigInt.toString());
  assert.notInStore('Deposit', depositId);
});

test('Withdraw call handlers shouldnt fire if Vault apiVersion > 0.4.3', () => {
  // setup the environment from scratch
  clearStore();
  createRegistryV1Entity(registry_address);
  CreateMockUSDCVault_1.mockChainState();
  AddStrategyToUSDCVault_2.mockChainState();
  DepositToVaultWithSpecAmount_3.mockChainState();
  WithdrawFromVaultWithSpecAmount_4.mockChainState();
  let vaultAddress = WithdrawFromVaultWithSpecAmount_4.VaultAddress;
  // we need to override the Fixture's apiVersion to 0.4.4
  createMockedFunction(
    Address.fromString(vaultAddress),
    'apiVersion',
    'apiVersion():(string)' // @ts-ignore
  ).returns([ethereum.Value.fromString('0.4.4')]);

  let depositor = WithdrawFromVaultWithSpecAmount_4.DepositorAddress;
  let amount = '79056085';
  let txnHash =
    '0xfbe5fe8f992480569f67f96dc35af74dfd38b0c20cae2e7cd9d949d9629e997b';

  let mockCall = createMockWithdraw1Call(
    Bytes.fromByteArray(ByteArray.fromHexString(txnHash)),
    Address.fromString(vaultAddress),
    Address.fromString(depositor),
    BigInt.fromString(amount),
    BigInt.fromString(amount)
  );
  handleWithdrawWithShares(mockCall);

  let transactionHashId = txnHash
    .concat('-')
    .concat(defaults.bigInt.toString());
  let withdrawlId = depositor
    .concat('-')
    .concat(transactionHashId)
    .concat('-')
    .concat(defaults.bigInt.toString());
  assert.notInStore('Withdrawal', withdrawlId);
});

test('Can add a strategy to a vault using handleAddStrategyV1 (event)', () => {
  // setup the environment from scratch
  clearStore();
  createRegistryV1Entity(registry_address);
  CreateMockUSDCVault_1.mockChainState();
  AddStrategyToUSDCVault_2.mockChainState();
  let vaultAddress = AddStrategyToUSDCVault_2.VaultAddress;
  let strategyAddress = AddStrategyToUSDCVault_2.StrategyAddress;

  // from https://etherscan.io/tx/0x3e059ed2652468576e10ea90bc1c3fcf2f125bbdb31c2f9063cb5108c68e1c59#eventlog
  let debtLimit = '9500';
  let rateLimit = '2000000000000';
  let performanceFee = '1000';
  let strategyName = 'StrategyGenericLevCompFarm';
  let mockEvent = createMockAddStrategyV1Event(
    Address.fromString(strategyAddress),
    Address.fromString(vaultAddress),
    debtLimit,
    rateLimit,
    performanceFee
  );
  handleStrategyAddedV1(mockEvent);

  assert.fieldEquals('Strategy', strategyAddress, 'vault', vaultAddress);
  assert.fieldEquals('Strategy', strategyAddress, 'name', strategyName);
  assert.fieldEquals(
    'Strategy',
    strategyAddress,
    'performanceFeeBps',
    performanceFee
  );
  assert.fieldEquals('Strategy', strategyAddress, 'debtLimit', debtLimit);
  assert.fieldEquals('Strategy', strategyAddress, 'rateLimit', rateLimit);
  assert.fieldEquals('Strategy', strategyAddress, 'minDebtPerHarvest', '0');
  assert.fieldEquals('Strategy', strategyAddress, 'maxDebtPerHarvest', '0');
});

test('Test UpdatePerformanceFeeEvent', () => {
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

  // By default, performance fee is 1000 bps. Let's override it for this test.
  let performanceFee = '500';
  createMockedFunction(
    Address.fromString('0x5f18c75abdae578b483e5f43f12a39cf75b973a9'),
    'performanceFee',
    'performanceFee():(uint256)'
  ).returns([
    // @ts-ignore
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(performanceFee)),
  ]);
  // end of environment setup

  let mockPerfFeeUpdate = createMockUpdatePerformanceFeeEvent(
    vaultAddress,
    performanceFee
  );
  handleUpdatePerformanceFee(mockPerfFeeUpdate);

  assert.fieldEquals(
    'Vault',
    vaultAddress,
    'performanceFeeBps',
    performanceFee
  );
  // grab latest update and make sure it has the correct fee
  let vaultEntity = VaultSchema.load(vaultAddress!);
  assert.assertNotNull(vaultEntity);
  let latestUpdateId = vaultEntity!.latestUpdate;
  assert.assertNotNull(latestUpdateId);

  assert.fieldEquals(
    'VaultUpdate',
    latestUpdateId!,
    'newPerformanceFee',
    performanceFee
  );
  // make management fee isn't impacted
  assert.fieldEquals(
    'VaultUpdate',
    latestUpdateId!,
    'newManagementFee',
    'null'
  );
});

test('Test UpdateManagementFeeEvent', () => {
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

  // By default, management fee is 200 bps. Let's override it for this test.
  let managementFee = '100';
  createMockedFunction(
    Address.fromString(vaultAddress),
    'managementFee',
    'managementFee():(uint256)'
  ).returns([
    // @ts-ignore
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(managementFee)),
  ]);
  // end of environment setup

  let mockManagementFeeUpdate = createMockUpdateManagementFeeEvent(
    vaultAddress,
    managementFee
  );
  handleUpdateManagementFee(mockManagementFeeUpdate);

  assert.fieldEquals('Vault', vaultAddress, 'managementFeeBps', managementFee);
  // grab latest update and make sure it has the correct fee
  let vaultEntity = VaultSchema.load(vaultAddress!);
  assert.assertNotNull(vaultEntity);
  let latestUpdateId = vaultEntity!.latestUpdate;
  assert.assertNotNull(latestUpdateId);

  assert.fieldEquals(
    'VaultUpdate',
    latestUpdateId!,
    'newManagementFee',
    managementFee
  );
  // make perf fee isn't impacted
  assert.fieldEquals(
    'VaultUpdate',
    latestUpdateId!,
    'newPerformanceFee',
    'null'
  );
});

test('Test UpdateRewardsEvent', () => {
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

  // By default, the rewards address is already set. Must override it for testing
  let newRewardsAddress = '0x000000000000000000000000000000000000dead';
  createMockedFunction(
    Address.fromString(vaultAddress),
    'rewards',
    'rewards():(address)'
  ).returns([
    // @ts-ignore
    ethereum.Value.fromAddress(Address.fromString(newRewardsAddress)),
  ]);
  // end of environment setup

  let mockRewardsUpdate = createMockUpdateRewardsEvent(
    vaultAddress,
    newRewardsAddress
  );
  handleUpdateRewards(mockRewardsUpdate);

  assert.fieldEquals('Vault', vaultAddress, 'rewards', newRewardsAddress);
  // grab latest update and make sure it has the correct fee
  let vaultEntity = VaultSchema.load(vaultAddress!);
  assert.assertNotNull(vaultEntity);
  let latestUpdateId = vaultEntity!.latestUpdate;
  assert.assertNotNull(latestUpdateId);

  assert.fieldEquals(
    'VaultUpdate',
    latestUpdateId!,
    'newRewards',
    newRewardsAddress
  );
});

clearStore();

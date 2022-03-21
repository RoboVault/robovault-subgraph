import { NewVault } from '../../generated/Registry/Registry';
import {
  StrategyReported as StrategyReported_v0_3_0_v0_3_1_Event,
  StrategyReported1 as StrategyReportedEvent,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  StrategyAdded as StrategyAddedV1Event,
  StrategyAdded1 as StrategyAddedV2Event,
  UpdatePerformanceFee,
  UpdateManagementFee,
  UpdateRewards,
} from '../../generated/Registry/Vault';
import {
  BigInt,
  ethereum,
  log,
  Address,
  Bytes,
  ByteArray,
} from '@graphprotocol/graph-ts';
import { newMockEvent } from 'matchstick-as';
import { defaults } from '../default';

// There ought to be a way to automatically generate this code.

export function createMockNewVaultEvent(
  token: Address, // @ts-ignore
  deployment_id: i32,
  vault: Address,
  api_version: string
): NewVault {
  log.info('[TEST] Creating mock NewVaultEvent. Vault: {}  Want Token: {}', [
    vault.toHexString(),
    token.toHexString(),
  ]);

  let mockEvent = newMockEvent();
  let newVaultEvent = new NewVault( // @ts-ignore
    mockEvent.address,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );
  newVaultEvent.parameters = new Array();

  let tokenParam = new ethereum.EventParam(
    'token',
    ethereum.Value.fromAddress(token)
  );
  let deployment_idParam = new ethereum.EventParam(
    'deployment_id',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(deployment_id))
  );
  let vaultParam = new ethereum.EventParam(
    'vault',
    ethereum.Value.fromAddress(vault)
  );
  let api_versionParam = new ethereum.EventParam(
    'api_version',
    ethereum.Value.fromString(api_version)
  );

  newVaultEvent.parameters.push(tokenParam);
  newVaultEvent.parameters.push(deployment_idParam);
  newVaultEvent.parameters.push(vaultParam);
  newVaultEvent.parameters.push(api_versionParam);

  return newVaultEvent;
}

export function createMockStrategyReported_v3_0_v3_1_Event(
  txnHash: string,
  vaultAddress: Address,
  strategyAddress: Address,
  gain: BigInt,
  loss: BigInt,
  totalGain: BigInt,
  totalLoss: BigInt,
  totalDebt: BigInt,
  debtAdded: BigInt,
  debtLimit: BigInt
): StrategyReported_v0_3_0_v0_3_1_Event {
  let mockEvent = newMockEvent();
  let strategyReportedEvent = new StrategyReported_v0_3_0_v0_3_1_Event(
    vaultAddress, // @ts-ignore
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );
  strategyReportedEvent.transaction.hash = Bytes.fromByteArray(
    ByteArray.fromHexString(txnHash)
  );
  strategyReportedEvent.parameters = new Array();

  let stratAddrParam = new ethereum.EventParam(
    'strategy',
    ethereum.Value.fromAddress(strategyAddress)
  );
  let gainParam = new ethereum.EventParam(
    'gain',
    ethereum.Value.fromUnsignedBigInt(gain)
  );
  let lossParam = new ethereum.EventParam(
    'loss',
    ethereum.Value.fromUnsignedBigInt(loss)
  );
  let totalGainParam = new ethereum.EventParam(
    'totalGain',
    ethereum.Value.fromUnsignedBigInt(totalGain)
  );
  let totalLossParam = new ethereum.EventParam(
    'totalLoss',
    ethereum.Value.fromUnsignedBigInt(totalLoss)
  );
  let totalDebtParam = new ethereum.EventParam(
    'totalDebt',
    ethereum.Value.fromUnsignedBigInt(totalDebt)
  );
  let debtAddedParam = new ethereum.EventParam(
    'debtAdded',
    ethereum.Value.fromUnsignedBigInt(debtAdded)
  );
  let debtLimitParam = new ethereum.EventParam(
    'debtLimit',
    ethereum.Value.fromUnsignedBigInt(debtLimit)
  );

  strategyReportedEvent.parameters.push(stratAddrParam);
  strategyReportedEvent.parameters.push(gainParam);
  strategyReportedEvent.parameters.push(lossParam);
  strategyReportedEvent.parameters.push(totalGainParam);
  strategyReportedEvent.parameters.push(totalLossParam);
  strategyReportedEvent.parameters.push(totalDebtParam);
  strategyReportedEvent.parameters.push(debtAddedParam);
  strategyReportedEvent.parameters.push(debtLimitParam);
  return strategyReportedEvent;
}

// https://github.com/yearn/yearn-vaults/blob/e592277b1d8f0a56b68f39f9f2551a80ec343266/contracts/Vault.vy#L923
export function createMockDepositEvent(
  transactionHash: Bytes,
  vaultAddress: Address,
  recipientUserAccountAddress: Address,
  sharesMinted: BigInt,
  amountDeposited: BigInt
): DepositEvent {
  let mockEvent = newMockEvent();
  mockEvent.transaction.hash = transactionHash;

  let depositEvent = new DepositEvent(
    vaultAddress, // @ts-ignore
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );

  let recipientParam = new ethereum.EventParam(
    'recipient',
    ethereum.Value.fromAddress(recipientUserAccountAddress)
  );

  let amountParam = new ethereum.EventParam(
    'amount',
    ethereum.Value.fromUnsignedBigInt(amountDeposited)
  );

  let sharesParam = new ethereum.EventParam(
    'shares',
    ethereum.Value.fromUnsignedBigInt(sharesMinted)
  );

  depositEvent.parameters.push(recipientParam);
  depositEvent.parameters.push(amountParam);
  depositEvent.parameters.push(sharesParam);

  return depositEvent;
}

// https://github.com/yearn/yearn-vaults/blob/e592277b1d8f0a56b68f39f9f2551a80ec343266/contracts/Vault.vy#L1149
export function createMockWithdrawEvent(
  transactionHash: Bytes,
  vaultAddress: Address,
  recipientUserAccountAddress: Address,
  sharesBurned: BigInt,
  amountWithdrawn: BigInt
): WithdrawEvent {
  let mockEvent = newMockEvent();
  mockEvent.transaction.hash = transactionHash;

  let withdrawEvent = new WithdrawEvent(
    vaultAddress, // @ts-ignore
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );

  let recipientParam = new ethereum.EventParam(
    'recipient',
    ethereum.Value.fromAddress(recipientUserAccountAddress)
  );

  let amountParam = new ethereum.EventParam(
    'amount',
    ethereum.Value.fromUnsignedBigInt(amountWithdrawn)
  );

  let sharesParam = new ethereum.EventParam(
    'shares',
    ethereum.Value.fromUnsignedBigInt(sharesBurned)
  );

  withdrawEvent.parameters.push(recipientParam);
  withdrawEvent.parameters.push(amountParam);
  withdrawEvent.parameters.push(sharesParam);

  return withdrawEvent;
}

// https://github.com/yearn/yearn-vaults/blob/c59c441cd63dc8004f130a33a66ead7de8819cce/contracts/Vault.vy#L465
export function createMockAddStrategyV1Event(
  strategy: Address,
  vaultAddress: Address,
  debtLimit: string,
  rateLimit: string,
  performanceFee: string
): StrategyAddedV1Event {
  let mockTransaction = new ethereum.Transaction(
    defaults.address,
    defaults.bigInt,
    defaults.address,
    vaultAddress,
    defaults.bigInt,
    defaults.bigInt,
    defaults.bigInt,
    defaults.addressBytes
  );

  let strategyParam = new ethereum.EventParam(
    'strategy',
    ethereum.Value.fromAddress(strategy)
  );
  let debtLimitParam = new ethereum.EventParam(
    'debtLimit',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(debtLimit))
  );
  let rateLimitParam = new ethereum.EventParam(
    'rateLimit',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(rateLimit))
  );
  let performanceFeeParam = new ethereum.EventParam(
    'performanceFee',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(performanceFee))
  );

  let addStrategyV1Event = new StrategyAddedV1Event(
    vaultAddress,
    defaults.bigInt,
    defaults.bigInt,
    defaults.string,
    defaults.block,
    mockTransaction,
    [strategyParam, debtLimitParam, rateLimitParam, performanceFeeParam]
  );

  return addStrategyV1Event;
}

// https://github.com/yearn/yearn-vaults/blob/e592277b1d8f0a56b68f39f9f2551a80ec343266/contracts/Vault.vy#L1239
export function createMockAddStrategyV2Event(
  strategy: string,
  vaultAddress: string,
  debtRatio: string,
  minDebtPerHarvest: string,
  maxDebtPerHarvest: string,
  performanceFee: string
): StrategyAddedV2Event {
  let mockTransaction = new ethereum.Transaction(
    defaults.address,
    defaults.bigInt,
    defaults.address,
    Address.fromString(vaultAddress),
    defaults.bigInt,
    defaults.bigInt,
    defaults.bigInt,
    defaults.addressBytes
  );

  let strategyParam = new ethereum.EventParam(
    'strategy',
    ethereum.Value.fromAddress(Address.fromString(strategy))
  );
  let debtRatioParam = new ethereum.EventParam(
    'debtRatio',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(debtRatio))
  );
  let minDebtPerHarvestParam = new ethereum.EventParam(
    'minDebtPerHarvest',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(minDebtPerHarvest))
  );
  let maxDebtPerHarvestParam = new ethereum.EventParam(
    'maxDebtPerHarvest',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(maxDebtPerHarvest))
  );
  let performanceFeeParam = new ethereum.EventParam(
    'performanceFee',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(performanceFee))
  );

  let addStrategyV2Event = new StrategyAddedV2Event(
    Address.fromString(vaultAddress),
    defaults.bigInt,
    defaults.bigInt,
    defaults.string,
    defaults.block,
    mockTransaction,
    [
      strategyParam,
      debtRatioParam,
      minDebtPerHarvestParam,
      maxDebtPerHarvestParam,
      performanceFeeParam,
    ]
  );

  return addStrategyV2Event;
}

export function createMockUpdatePerformanceFeeEvent(
  vaultAddress: string,
  performanceFee: string
): UpdatePerformanceFee {
  let mockTransaction = new ethereum.Transaction(
    defaults.address,
    defaults.bigInt,
    defaults.address,
    Address.fromString(vaultAddress),
    defaults.bigInt,
    defaults.bigInt,
    defaults.bigInt,
    defaults.addressBytes
  );

  let performanceFeeParam = new ethereum.EventParam(
    'performanceFee',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(performanceFee))
  );

  let mockEvent = new UpdatePerformanceFee(
    Address.fromString(vaultAddress),
    defaults.bigInt,
    defaults.bigInt,
    defaults.string,
    defaults.block,
    mockTransaction,
    [performanceFeeParam]
  );

  return mockEvent;
}

export function createMockUpdateManagementFeeEvent(
  vaultAddress: string,
  managementFee: string
): UpdateManagementFee {
  let mockTransaction = new ethereum.Transaction(
    defaults.address,
    defaults.bigInt,
    defaults.address,
    Address.fromString(vaultAddress),
    defaults.bigInt,
    defaults.bigInt,
    defaults.bigInt,
    defaults.addressBytes
  );

  let managementFeeParam = new ethereum.EventParam(
    'managementFee',
    ethereum.Value.fromUnsignedBigInt(BigInt.fromString(managementFee))
  );

  let mockEvent = new UpdateManagementFee(
    Address.fromString(vaultAddress),
    defaults.bigInt,
    defaults.bigInt,
    defaults.string,
    defaults.block,
    mockTransaction,
    [managementFeeParam]
  );

  return mockEvent;
}

export function createMockUpdateRewardsEvent(
  vaultAddress: string,
  newRewardsAddress: string
): UpdateRewards {
  let mockTransaction = new ethereum.Transaction(
    defaults.address,
    defaults.bigInt,
    defaults.address,
    Address.fromString(vaultAddress),
    defaults.bigInt,
    defaults.bigInt,
    defaults.bigInt,
    defaults.addressBytes
  );

  let rewardsParam = new ethereum.EventParam(
    'rewards',
    ethereum.Value.fromAddress(Address.fromString(newRewardsAddress))
  );

  let mockEvent = new UpdateRewards(
    Address.fromString(vaultAddress),
    defaults.bigInt,
    defaults.bigInt,
    defaults.string,
    defaults.block,
    mockTransaction,
    [rewardsParam]
  );

  return mockEvent;
}

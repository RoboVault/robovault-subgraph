import { log } from '@graphprotocol/graph-ts';
import {
  StrategyReported as StrategyReported_v0_3_0_v0_3_1_Event,
  StrategyMigrated as StrategyMigratedEvent,
  StrategyReported1 as StrategyReportedEvent,
  Deposit1Call as DepositCall,
  Transfer as TransferEvent,
  Withdraw1Call as WithdrawCall,
  Vault as VaultContract,
  Deposit2Call,
  Deposit1Call,
  Withdraw1Call,
  Withdraw2Call,
  Withdraw3Call,
  AddStrategyCall as AddStrategyV1Call,
  AddStrategy1Call as AddStrategyV2Call,
  StrategyAdded as StrategyAddedV1Event,
  StrategyAdded1 as StrategyAddedV2Event,
  Deposit as DepositEvent,
  Withdraw as WithdrawEvent,
  UpdatePerformanceFee as UpdatePerformanceFeeEvent,
  UpdateManagementFee as UpdateManagementFeeEvent,
  StrategyAddedToQueue as StrategyAddedToQueueEvent,
  StrategyRemovedFromQueue as StrategyRemovedFromQueueEvent,
  UpdateRewards as UpdateRewardsEvent,
  UpdateHealthCheck as UpdateHealthCheckEvent,
} from '../../generated/Registry/Vault';
import { Strategy, StrategyMigration } from '../../generated/schema';
import { printCallInfo } from '../utils/commons';
import { BIGINT_ZERO, BIGINT_MAX, ZERO_ADDRESS } from '../utils/constants';
import * as strategyLibrary from '../utils/strategy/strategy';
import {
  getOrCreateTransactionFromCall,
  getOrCreateTransactionFromEvent,
} from '../utils/transaction';
import * as vaultLibrary from '../utils/vault/vault';
import * as migrationLibrary from '../utils/strategy/strategy-migration';
import {
  shouldSkipDepositCall,
  shouldSkipWithdrawCall,
} from './mapUtils/callFilters';

/* This version of the AddStrategy event is used in vaults 0.3.2 and up */
export function handleStrategyAddedV2(event: StrategyAddedV2Event): void {
  let transaction = getOrCreateTransactionFromEvent(
    event,
    'AddStrategyV2Event'
  );
  strategyLibrary.createAndGet(
    transaction.id,
    event.params.strategy,
    event.address,
    event.params.debtRatio,
    BIGINT_ZERO,
    event.params.minDebtPerHarvest,
    event.params.maxDebtPerHarvest,
    event.params.performanceFee,
    null,
    transaction
  );
}

/* This version of the AddStrategy event was used in vaults from 0.1.0 up to and including 0.3.1 */
export function handleStrategyAddedV1(event: StrategyAddedV1Event): void {
  let transaction = getOrCreateTransactionFromEvent(
    event,
    'AddStrategyV1Event'
  );
  strategyLibrary.createAndGet(
    transaction.id,
    event.params.strategy,
    event.address,
    event.params.debtLimit,
    event.params.rateLimit,
    BIGINT_ZERO,
    BIGINT_ZERO,
    event.params.performanceFee,
    null,
    transaction
  );
}

/**
 * We have two handlers to process the StrategyReported event due to incompatibility in both event structure.
 * This is for vault versions 0.3.0 and 0.3.1.
 * If you need 0.3.2 or superior, please see the 'handleStrategyReported' handler.
 */
export function handleStrategyReported_v0_3_0_v0_3_1(
  event: StrategyReported_v0_3_0_v0_3_1_Event
): void {
  log.info('[Vault mappings v0_3_0 and v0_3_1] Handle strategy reported', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyReportedEvent'
  );
  let strategyReport = strategyLibrary.createReport(
    ethTransaction,
    event.params.strategy.toHexString(),
    event.params.gain,
    event.params.loss,
    event.params.totalGain,
    event.params.totalLoss,
    event.params.totalDebt,
    event.params.debtAdded,
    event.params.debtLimit,
    BIGINT_ZERO,
    event
  );
  if (!strategyReport) {
    return;
  }

  log.info(
    '[Vault mappings] Updating price per share (strategy reported): {}',
    [event.transaction.hash.toHexString()]
  );
  let vaultContractAddress = event.address;
  let vaultContract = VaultContract.bind(vaultContractAddress);
  vaultLibrary.strategyReported(
    ethTransaction,
    strategyReport,
    vaultContract,
    vaultContractAddress
  );
}

/**
 * We have two handlers to process the StrategyReported event due to incompatibility in both event structure.
 * This is for vault versions 0.3.2 or superior.
 *
 * This version includes the new field `debtPaid` introduced in the Vault version 0.3.2.
 *
 * In case a new structure is implemented, please create a new handler.
 * If you need 0.3.0 or 0.3.1, please see the 'handleStrategyReported_v0_3_0_v0_3_1' handler.
 */
export function handleStrategyReported(event: StrategyReportedEvent): void {
  log.info('[Vault mappings] Handle strategy reported', []);
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyReportedEvent'
  );

  let strategyReport = strategyLibrary.createReport(
    ethTransaction,
    event.params.strategy.toHexString(),
    event.params.gain,
    event.params.loss,
    event.params.totalGain,
    event.params.totalLoss,
    event.params.totalDebt,
    event.params.debtAdded,
    event.params.debtRatio,
    event.params.debtPaid,
    event
  );

  log.info(
    '[Vault mappings] Updating price per share (strategy reported): {}',
    [event.transaction.hash.toHexString()]
  );
  let vaultContractAddress = event.address;
  let vaultContract = VaultContract.bind(vaultContractAddress);
  vaultLibrary.strategyReported(
    ethTransaction,
    strategyReport!,
    vaultContract,
    vaultContractAddress
  );
}

export function handleStrategyMigrated(event: StrategyMigratedEvent): void {
  log.info(
    '[Strategy Migrated] Handle strategy migrated event. Old strategy: {} New strategy: {}',
    [
      event.params.oldVersion.toHexString(),
      event.params.newVersion.toHexString(),
    ]
  );
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyMigratedEvent'
  );

  let oldStrategyAddress = event.params.oldVersion;
  let oldStrategy = Strategy.load(oldStrategyAddress.toHexString());

  if (oldStrategy !== null) {
    let newStrategyAddress = event.params.newVersion;
    migrationLibrary.createMigration(
      oldStrategy,
      newStrategyAddress,
      ethTransaction
    );

    if (Strategy.load(newStrategyAddress.toHexString()) !== null) {
      log.warning(
        '[Strategy Migrated] Migrating to strategy {} but it has already been created',
        [newStrategyAddress.toHexString()]
      );
    } else {
      strategyLibrary.createAndGet(
        ethTransaction.id,
        newStrategyAddress,
        event.address,
        oldStrategy.debtLimit,
        oldStrategy.rateLimit,
        oldStrategy.minDebtPerHarvest,
        oldStrategy.maxDebtPerHarvest,
        oldStrategy.performanceFeeBps,
        null,
        ethTransaction
      );
      vaultLibrary.strategyRemovedFromQueue(
        oldStrategyAddress,
        ethTransaction,
        event
      );
    }
  }
}

//  VAULT BALANCE UPDATES

export function handleDepositEvent(event: DepositEvent): void {
  log.debug('[Vault mappings] Handle deposit event', []);
  let amount = event.params.amount;
  let sharesMinted = event.params.shares;
  let recipient = event.params.recipient;
  let vaultAddress = event.address;

  log.info('[Vault mappings] Handle deposit (event) shares {} - amount {}', [
    sharesMinted.toString(),
    amount.toString(),
  ]);

  let transaction = getOrCreateTransactionFromEvent(event, 'DepositEvent');

  vaultLibrary.deposit(
    vaultAddress,
    transaction,
    recipient,
    amount,
    sharesMinted,
    event.block.timestamp
  );
}

export function handleDeposit(call: DepositCall): void {
  log.debug('[Vault mappings] Handle deposit', []);

  if (shouldSkipDepositCall(call.to, call.from, call.transaction.hash)) {
    return;
  }

  let transaction = getOrCreateTransactionFromCall(call, 'vault.deposit()');
  let sharesMinted = call.outputs.value0;
  let amount = vaultLibrary.calculateAmountDeposited(call.to, sharesMinted);

  log.info('[Vault mappings] Handle deposit() shares {} - amount {}', [
    sharesMinted.toString(),
    amount.toString(),
  ]);
  vaultLibrary.deposit(
    call.to,
    transaction,
    call.from,
    amount,
    sharesMinted,
    call.block.timestamp
  );
}

export function handleDepositWithAmount(call: Deposit1Call): void {
  log.debug('[Vault mappings] Handle deposit with amount', []);
  if (shouldSkipDepositCall(call.to, call.from, call.transaction.hash)) {
    return;
  }

  let transaction = getOrCreateTransactionFromCall(call, 'vault.deposit(uint)');
  let sharesMinted = call.outputs.value0;

  // If _amount is uint256.max, the vault contract treats this like deposit()
  // https://github.com/yearn/yearn-vaults/blob/main/contracts/Vault.vy#L894-L897
  let amount = call.inputs._amount;
  if (amount == BIGINT_MAX) {
    amount = vaultLibrary.calculateAmountDeposited(call.to, sharesMinted);
  }

  vaultLibrary.deposit(
    call.to, // Vault Address
    transaction,
    call.from,
    amount,
    sharesMinted,
    call.block.timestamp
  );
}

export function handleDepositWithAmountAndRecipient(call: Deposit2Call): void {
  log.debug('[Vault mappings] Handle deposit with amount and recipient', []);
  if (shouldSkipDepositCall(call.to, call.from, call.transaction.hash)) {
    return;
  }

  let transaction = getOrCreateTransactionFromCall(
    call,
    'vault.deposit(uint,address)'
  );
  log.info(
    '[Vault mappings] Handle deposit(amount, recipient): TX: {} Vault address {} Amount: {} Recipient: {} From: {}',
    [
      call.transaction.hash.toHexString(),
      call.to.toHexString(),
      call.inputs._amount.toString(),
      call.inputs._recipient.toHexString(),
      call.from.toHexString(),
    ]
  );

  let blockNumber = call.block.number.toString();
  let txHash = call.transaction.hash.toHexString();
  log.info('TXDeposit {} block {} call.input.recipient {}', [
    txHash,
    blockNumber,
    call.inputs._recipient.toHexString(),
  ]);
  printCallInfo('TXDeposit', call);

  let sharesMinted = call.outputs.value0;
  // If _amount is uint256.max, the vault contract treats this like deposit()
  // https://github.com/yearn/yearn-vaults/blob/main/contracts/Vault.vy#L894-L897
  let amount = call.inputs._amount;
  if (amount == BIGINT_MAX) {
    amount = vaultLibrary.calculateAmountDeposited(call.to, sharesMinted);
  }

  vaultLibrary.deposit(
    call.to, // Vault Address
    transaction,
    call.inputs._recipient, // Recipient
    amount,
    sharesMinted,
    call.block.timestamp
  );
}

export function handleWithdrawEvent(event: WithdrawEvent): void {
  log.debug('[Vault mappings] Handle withdraw event', []);
  let amount = event.params.amount;
  let sharesBurnt = event.params.shares;
  let recipient = event.params.recipient;
  let vaultAddress = event.address;

  log.info('[Vault mappings] Handle withdraw (event) shares {} - amount {}', [
    sharesBurnt.toString(),
    amount.toString(),
  ]);

  let transaction = getOrCreateTransactionFromEvent(event, 'WithdrawEvent');

  vaultLibrary.withdraw(
    vaultAddress,
    recipient,
    amount,
    sharesBurnt,
    transaction,
    event.block.timestamp
  );
}

export function handleWithdraw(call: WithdrawCall): void {
  log.info('[Vault mappings] Handle withdraw. TX hash: {}', [
    call.transaction.hash.toHexString(),
  ]);
  if (shouldSkipWithdrawCall(call.to, call.from, call.transaction.hash)) {
    return;
  }

  let transaction = getOrCreateTransactionFromCall(call, 'vault.withdraw()');
  log.info('[Vault mappings] Handle withdraw(): Vault address {}', [
    call.to.toHexString(),
  ]);

  let vaultContract = VaultContract.bind(call.to);
  let withdrawnAmount = call.outputs.value0;
  let totalAssets = vaultContract.totalAssets();
  let totalSupply = vaultContract.totalSupply();
  let totalSharesBurnt = totalAssets.equals(BIGINT_ZERO)
    ? withdrawnAmount
    : withdrawnAmount.times(totalSupply).div(totalAssets);

  vaultLibrary.withdraw(
    call.to,
    call.from,
    withdrawnAmount,
    totalSharesBurnt,
    transaction,
    call.block.timestamp
  );
}

export function handleWithdrawWithShares(call: Withdraw1Call): void {
  log.info('[Vault mappings] Handle withdraw with shares. TX hash: {}', [
    call.transaction.hash.toHexString(),
  ]);
  if (shouldSkipWithdrawCall(call.to, call.from, call.transaction.hash)) {
    return;
  }

  let transaction = getOrCreateTransactionFromCall(
    call,
    'vault.withdraw(uint256)'
  );
  log.info('[Vault mappings] Handle withdraw(shares): Vault address {}', [
    call.to.toHexString(),
  ]);

  vaultLibrary.withdraw(
    call.to,
    call.from,
    call.outputs.value0,
    call.inputs._shares,
    transaction,
    call.block.timestamp
  );
}

export function handleWithdrawWithSharesAndRecipient(
  call: Withdraw2Call
): void {
  log.info(
    '[Vault mappings] Handle withdraw with shares and recipient. TX hash: {}',
    [call.transaction.hash.toHexString()]
  );
  if (shouldSkipWithdrawCall(call.to, call.from, call.transaction.hash)) {
    return;
  }

  let transaction = getOrCreateTransactionFromCall(
    call,
    'vault.withdraw(uint256,address)'
  );
  log.info(
    '[Vault mappings] Handle withdraw(shares, recipient): TX: {} Vault address {} Shares: {} Recipient: {} From: {}',
    [
      call.transaction.hash.toHexString(),
      call.to.toHexString(),
      call.inputs._shares.toString(),
      call.inputs._recipient.toHexString(),
      call.from.toHexString(),
    ]
  );

  let blockNumber = call.block.number.toString();
  let txHash = call.transaction.hash.toHexString();
  log.info('TXWithdraw {} block {} call.input.recipient {}', [
    txHash,
    blockNumber,
    call.inputs._recipient.toHexString(),
  ]);
  printCallInfo('TXWithdraw', call);
  vaultLibrary.withdraw(
    call.to, // Vault Address
    call.from, // From
    call.outputs.value0,
    call.inputs._shares,
    transaction,
    call.block.timestamp
  );
}

export function handleWithdrawWithSharesAndRecipientAndMaxLoss(
  call: Withdraw3Call
): void {
  log.info(
    '[Vault mappings] Handle withdraw with shares, recipient and max loss. TX hash: {}',
    [call.transaction.hash.toHexString()]
  );
  if (shouldSkipWithdrawCall(call.to, call.from, call.transaction.hash)) {
    return;
  }

  let transaction = getOrCreateTransactionFromCall(
    call,
    'vault.withdraw(uint256,address,uint256)'
  );
  log.info(
    '[Vault mappings] Handle withdraw(shares, recipient, maxLoss): Vault address {}',
    [call.to.toHexString()]
  );
  log.info(
    'vault.withdraw(uint256,address,maxLoss) WITHDRAW TEST TX Hash {} From {} To {} recipient {}',
    [
      call.transaction.hash.toHexString(),
      call.from.toHexString(),
      call.to.toHexString(),
      call.inputs.recipient.toHexString(),
    ]
  );

  vaultLibrary.withdraw(
    call.to,
    call.from, // From
    call.outputs.value0,
    call.inputs.maxShares,
    transaction,
    call.block.timestamp
  );
}

export function handleTransfer(event: TransferEvent): void {
  log.info('[Vault mappings] Handle transfer: From: {} - To: {}. TX hash: {}', [
    event.params.sender.toHexString(),
    event.params.receiver.toHexString(),
    event.transaction.hash.toHexString(),
  ]);
  if (
    event.params.sender.toHexString() != ZERO_ADDRESS &&
    event.params.receiver.toHexString() != ZERO_ADDRESS
  ) {
    log.info(
      '[Vault mappings] Processing transfer: From: {} - To: {}. TX hash: {}',
      [
        event.params.sender.toHexString(),
        event.params.receiver.toHexString(),
        event.transaction.hash.toHexString(),
      ]
    );
    let transaction = getOrCreateTransactionFromEvent(
      event,
      'vault.transfer(address,uint256)'
    );
    let vaultContract = VaultContract.bind(event.address);
    let totalAssets = vaultContract.totalAssets();
    let totalSupply = vaultContract.totalSupply();
    let sharesAmount = event.params.value;
    let amount = sharesAmount.times(totalAssets).div(totalSupply);
    // share  = (amount * totalSupply) / totalAssets
    // amount = (shares * totalAssets) / totalSupply
    vaultLibrary.transfer(
      vaultContract,
      event.params.sender,
      event.params.receiver,
      amount,
      vaultContract.token(),
      sharesAmount,
      event.address,
      transaction
    );
  } else {
    log.info(
      '[Vault mappings] Not processing transfer: From: {} - To: {}. TX hash: {}',
      [
        event.params.sender.toHexString(),
        event.params.receiver.toHexString(),
        event.transaction.hash.toHexString(),
      ]
    );
  }
}

export function handleUpdatePerformanceFee(
  event: UpdatePerformanceFeeEvent
): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdatePerformanceFee'
  );

  let vaultContract = VaultContract.bind(event.address);

  vaultLibrary.performanceFeeUpdated(
    event.address,
    ethTransaction,
    vaultContract,
    event.params.performanceFee
  );
}

export function handleUpdateManagementFee(
  event: UpdateManagementFeeEvent
): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateManagementFee'
  );

  let vaultContract = VaultContract.bind(event.address);

  vaultLibrary.managementFeeUpdated(
    event.address,
    ethTransaction,
    vaultContract,
    event.params.managementFee
  );
}

export function handleStrategyAddedToQueue(
  event: StrategyAddedToQueueEvent
): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyAddedToQueue'
  );

  vaultLibrary.strategyAddedToQueue(
    event.params.strategy,
    ethTransaction,
    event
  );
}

export function handleStrategyRemovedFromQueue(
  event: StrategyRemovedFromQueueEvent
): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'StrategyRemovedFromQueue'
  );
  vaultLibrary.strategyRemovedFromQueue(
    event.params.strategy,
    ethTransaction,
    event
  );
}

export function handleUpdateRewards(event: UpdateRewardsEvent): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateRewardsEvent'
  );

  let vaultContract = VaultContract.bind(event.address);

  vaultLibrary.handleUpdateRewards(
    event.address,
    vaultContract,
    event.params.rewards,
    ethTransaction
  );
}

export function handleUpdateHealthCheck(event: UpdateHealthCheckEvent): void {
  let ethTransaction = getOrCreateTransactionFromEvent(
    event,
    'UpdateHealthCheck'
  );

  vaultLibrary.handleUpdateHealthCheck(
    event.address,
    event.params.healthCheck,
    ethTransaction
  );
}

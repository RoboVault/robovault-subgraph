import { Address, log, BigInt } from '@graphprotocol/graph-ts';
import { Vault as VaultContract } from '../../../generated/Registry/Vault';
import * as vaultLibrary from '../../utils/vault/vault';
import { Strategy, Transaction, Vault } from '../../../generated/schema';
import { isEventBlockNumberLt, printCallInfo } from '../../utils/commons';
import {
  BIGINT_ZERO,
  ZERO_ADDRESS,
  DON_T_CREATE_VAULT_TEMPLATE,
  EXPERIMENTAL,
  API_VERSION_0_4_2,
  ROBO_VAULT_REGISTRY,
} from '../../utils/constants';
import * as strategyLibrary from '../../utils/strategy/strategy';
import {
  getOrCreateTransactionFromCall,
  getOrCreateTransactionFromEvent,
} from '../../utils/transaction';
import {
    StrategyReported as StrategyReported_v0_3_0_v0_3_1_Event,
    StrategyMigrated,
    StrategyReported1 as StrategyReportedEvent,
    Deposit1Call as DepositCall,
    Transfer as TransferEvent,
    Withdraw1Call as WithdrawCall,
    Deposit2Call,
    Deposit1Call,
    Withdraw1Call,
    Withdraw2Call,
    Withdraw3Call,
    UpdatePerformanceFee as UpdatePerformanceFeeEvent,
    UpdateManagementFee as UpdateManagementFeeEvent,
    StrategyAdded1 as StrategyAddedV2Event,
    StrategyAddedToQueue as StrategyAddedToQueueEvent,
    StrategyRemovedFromQueue as StrategyRemovedFromQueueEvent,
    UpdateRewards as UpdateRewardsEvent,
  } from '../../../generated/RoboVaultV3WBTC/Vault';

const VAULT_NAME = 'RoboVaultV3WBTC';
const VAULT_ADDED_TO_REGISTRY = BigInt.fromI32(99999999);

function createVaultIfNeeded(
  vaultAddress: Address,
  transaction: Transaction
): Vault {
  const blankRegistryAddress = changetype<Address>(
    Address.fromHexString(ROBO_VAULT_REGISTRY)
  );
  return vaultLibrary.createCustomVaultIfNeeded(
    vaultAddress,
    blankRegistryAddress,
    EXPERIMENTAL,
    API_VERSION_0_4_2,
    transaction,
    DON_T_CREATE_VAULT_TEMPLATE
  );
}

/* This version of the AddStrategy event is used in vaults 0.3.2 and up */
export function handleStrategyAddedV2(event: StrategyAddedV2Event): void {
  const eventName = `${VAULT_NAME}_StrategyAddedV2Event`;

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
    let transaction = getOrCreateTransactionFromEvent(event, eventName);
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
}

/**
 * We have two handlers to process the StrategyReported event due to incompatibility in both event structure.
 * This is for vault versions 0.3.0 and 0.3.1.
 * If you need 0.3.2 or superior, please see the 'handleStrategyReported' handler.
 */
export function handleStrategyReported_v0_3_0_v0_3_1(
  event: StrategyReported_v0_3_0_v0_3_1_Event
): void {
  const eventName = `${VAULT_NAME}_StrategyReportedEvent_V030_V031`;

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
    log.info('[Vault mappings v0_3_0 and v0_3_1] Handle strategy reported', []);
    let ethTransaction = getOrCreateTransactionFromEvent(event, eventName);
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
  const eventName = `${VAULT_NAME}_StrategyReportedEvent`;

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
    log.info('[Vault mappings] Handle strategy reported', []);
    let ethTransaction = getOrCreateTransactionFromEvent(event, eventName);

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
}

export function handleStrategyMigrated(event: StrategyMigrated): void {
  const eventName = `${VAULT_NAME}_StrategyMigratedEvent`;

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
    log.info(
      '[Strategy Migrated] Handle strategy migrated event. Old strategy: {} New strategy: {}',
      [
        event.params.oldVersion.toHexString(),
        event.params.newVersion.toHexString(),
      ]
    );
    let ethTransaction = getOrCreateTransactionFromEvent(event, eventName);

    let oldStrategyAddress = event.params.oldVersion;
    let oldStrategy = Strategy.load(oldStrategyAddress.toHexString());

    if (oldStrategy !== null) {
      let newStrategyAddress = event.params.newVersion;

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
}

//  VAULT BALANCE UPDATES

export function handleDeposit(call: DepositCall): void {
  const eventName = `${VAULT_NAME}_DepositEvent`;

  log.debug('[Vault mappings] Handle deposit', []);

  if (vaultLibrary.isVault(call.to) && vaultLibrary.isVault(call.from)) {
    log.warning(
      `${eventName} - TX {} - Call to {} and call from {} are vaults (minimal proxy). Not processing deposit tx.`,
      [
        call.transaction.hash.toHexString(),
        call.to.toHexString(),
        call.from.toHexString(),
      ]
    );
    return;
  }
  if (isEventBlockNumberLt(eventName, call.block, VAULT_ADDED_TO_REGISTRY)) {
    let transaction = getOrCreateTransactionFromCall(call, eventName);
    createVaultIfNeeded(call.to, transaction);
    let vaultContract = VaultContract.bind(call.to);
    let totalAssets = vaultContract.totalAssets();
    let totalSupply = vaultContract.totalSupply();
    let sharesAmount = call.outputs.value0;
    log.info(
      '[Vault mappings] Handle deposit() shares {} - total assets {} - total supply {}',
      [sharesAmount.toString(), totalAssets.toString(), totalSupply.toString()]
    );
    let amount = totalSupply.isZero()
      ? BIGINT_ZERO
      : sharesAmount.times(totalAssets).div(totalSupply);
    log.info('[Vault mappings] Handle deposit() shares {} - amount {}', [
      sharesAmount.toString(),
      amount.toString(),
    ]);
    vaultLibrary.deposit(
      call.to,
      transaction,
      call.from,
      amount,
      call.outputs.value0,
      call.block.timestamp
    );
  }
}

export function handleDepositWithAmount(call: Deposit1Call): void {
  const eventName = `${VAULT_NAME}_DepositWithAmountEvent`;

  log.debug('[Vault mappings] Handle deposit with amount', []);
  if (vaultLibrary.isVault(call.to) && vaultLibrary.isVault(call.from)) {
    log.warning(
      `${eventName} - TX {} - Call to {} and call from {} are vaults (minimal proxy). Not processing deposit tx.`,
      [
        call.transaction.hash.toHexString(),
        call.to.toHexString(),
        call.from.toHexString(),
      ]
    );
    return;
  }
  if (isEventBlockNumberLt(eventName, call.block, VAULT_ADDED_TO_REGISTRY)) {
    let transaction = getOrCreateTransactionFromCall(call, eventName);
    createVaultIfNeeded(call.to, transaction);
    vaultLibrary.deposit(
      call.to, // Vault Address
      transaction,
      call.from,
      call.inputs._amount,
      call.outputs.value0,
      call.block.timestamp
    );
  }
}

export function handleDepositWithAmountAndRecipient(call: Deposit2Call): void {
  const eventName = `${VAULT_NAME}_DepositWithAmountAndRecipientEvent`;

  log.debug('[Vault mappings] Handle deposit with amount and recipient', []);
  if (vaultLibrary.isVault(call.to) && vaultLibrary.isVault(call.from)) {
    log.warning(
      `${eventName} - TX {} - Call to {} and call from {} are vaults (minimal proxy). Not processing deposit tx.`,
      [
        call.transaction.hash.toHexString(),
        call.to.toHexString(),
        call.from.toHexString(),
      ]
    );
    return;
  }

  if (isEventBlockNumberLt(eventName, call.block, VAULT_ADDED_TO_REGISTRY)) {
    let transaction = getOrCreateTransactionFromCall(call, eventName);
    createVaultIfNeeded(call.to, transaction);
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
    vaultLibrary.deposit(
      call.to, // Vault Address
      transaction,
      call.inputs._recipient, // Recipient
      call.inputs._amount,
      call.outputs.value0,
      call.block.timestamp
    );
  }
}

export function handleWithdraw(call: WithdrawCall): void {
  const eventName = `${VAULT_NAME}_WithdrawEvent`;

  log.info('[Vault mappings] Handle withdraw. TX hash: {}', [
    call.transaction.hash.toHexString(),
  ]);
  if (vaultLibrary.isVault(call.to) && vaultLibrary.isVault(call.from)) {
    log.warning(
      `${eventName} - TX {} - Call to {} and call from {} are vaults (minimal proxy). Not processing withdraw tx.`,
      [
        call.transaction.hash.toHexString(),
        call.to.toHexString(),
        call.from.toHexString(),
      ]
    );
    return;
  }
  if (isEventBlockNumberLt(eventName, call.block, VAULT_ADDED_TO_REGISTRY)) {
    let transaction = getOrCreateTransactionFromCall(call, eventName);
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
}

export function handleWithdrawWithShares(call: Withdraw1Call): void {
  const eventName = `${VAULT_NAME}_WithdrawWithSharesEvent`;

  log.info('[Vault mappings] Handle withdraw with shares. TX hash: {}', [
    call.transaction.hash.toHexString(),
  ]);
  if (vaultLibrary.isVault(call.to) && vaultLibrary.isVault(call.from)) {
    log.warning(
      `${eventName} - TX {} - Call to {} and call from {} are vaults (minimal proxy). Not processing withdraw tx.`,
      [
        call.transaction.hash.toHexString(),
        call.to.toHexString(),
        call.from.toHexString(),
      ]
    );
    return;
  }
  if (isEventBlockNumberLt(eventName, call.block, VAULT_ADDED_TO_REGISTRY)) {
    let transaction = getOrCreateTransactionFromCall(call, eventName);
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
}

export function handleWithdrawWithSharesAndRecipient(
  call: Withdraw2Call
): void {
  const eventName = `${VAULT_NAME}_WithdrawWithSharesAndRecipientEvent`;

  log.info(
    '[Vault mappings] Handle withdraw with shares and recipient. TX hash: {}',
    [call.transaction.hash.toHexString()]
  );
  if (vaultLibrary.isVault(call.to) && vaultLibrary.isVault(call.from)) {
    log.warning(
      `${eventName} - TX {} - Call to {} and call from {} are vaults (minimal proxy). Not processing withdraw tx.`,
      [
        call.transaction.hash.toHexString(),
        call.to.toHexString(),
        call.from.toHexString(),
        call.inputs._recipient.toHexString(),
      ]
    );
    return;
  }
  if (isEventBlockNumberLt(eventName, call.block, VAULT_ADDED_TO_REGISTRY)) {
    let transaction = getOrCreateTransactionFromCall(call, eventName);
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
}

export function handleWithdrawWithSharesAndRecipientAndMaxLoss(
  call: Withdraw3Call
): void {
  const eventName = `${VAULT_NAME}_WithdrawWithSharesAndRecipientAndMaxLossEvent`;

  log.info(
    '[Vault mappings] Handle withdraw with shares, recipient and max loss. TX hash: {}',
    [call.transaction.hash.toHexString()]
  );
  if (vaultLibrary.isVault(call.to) && vaultLibrary.isVault(call.from)) {
    log.warning(
      `${eventName} - TX {} - Call to {} and call from {} are vaults (minimal proxy). Not processing withdraw tx.`,
      [
        call.transaction.hash.toHexString(),
        call.to.toHexString(),
        call.from.toHexString(),
        call.inputs.recipient.toHexString(),
      ]
    );
    return;
  }
  if (isEventBlockNumberLt(eventName, call.block, VAULT_ADDED_TO_REGISTRY)) {
    let transaction = getOrCreateTransactionFromCall(call, eventName);
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
}

export function handleTransfer(event: TransferEvent): void {
  const eventName = `${VAULT_NAME}_TransferEvent`;

  log.info('[Vault mappings] Handle transfer: From: {} - To: {}. TX hash: {}', [
    event.params.sender.toHexString(),
    event.params.receiver.toHexString(),
    event.transaction.hash.toHexString(),
  ]);

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
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
      let transaction = getOrCreateTransactionFromEvent(event, eventName);
      createVaultIfNeeded(event.address, transaction);
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
}

export function handleUpdatePerformanceFee(
  event: UpdatePerformanceFeeEvent
): void {
  const eventName = `${VAULT_NAME}_UpdatePerformanceFeeEvent`;

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
    let ethTransaction = getOrCreateTransactionFromEvent(event, eventName);
    createVaultIfNeeded(event.address, ethTransaction);

    let vaultContract = VaultContract.bind(event.address);

    vaultLibrary.performanceFeeUpdated(
      event.address,
      ethTransaction,
      vaultContract,
      event.params.performanceFee
    );
  }
}

export function handleUpdateManagementFee(
  event: UpdateManagementFeeEvent
): void {
  const eventName = `${VAULT_NAME}_UpdateManagementFeeEvent`;

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
    let ethTransaction = getOrCreateTransactionFromEvent(event, eventName);
    createVaultIfNeeded(event.address, ethTransaction);

    let vaultContract = VaultContract.bind(event.address);

    vaultLibrary.managementFeeUpdated(
      event.address,
      ethTransaction,
      vaultContract,
      event.params.managementFee
    );
  }
}

export function handleStrategyAddedToQueue(
  event: StrategyAddedToQueueEvent
): void {
  const eventName = `${VAULT_NAME}_StrategyAddedToQueueEvent`;

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
    let ethTransaction = getOrCreateTransactionFromEvent(event, eventName);

    vaultLibrary.strategyAddedToQueue(
      event.params.strategy,
      ethTransaction,
      event
    );
  }
}

export function handleStrategyRemovedFromQueue(
  event: StrategyRemovedFromQueueEvent
): void {
  const eventName = `${VAULT_NAME}_StrategyRemovedFromQueueEvent`;

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
    let ethTransaction = getOrCreateTransactionFromEvent(event, eventName);
    vaultLibrary.strategyRemovedFromQueue(
      event.params.strategy,
      ethTransaction,
      event
    );
  }
}

export function handleUpdateRewards(event: UpdateRewardsEvent): void {
  const eventName = `${VAULT_NAME}_UpdateRewardsEvent`;

  if (isEventBlockNumberLt(eventName, event.block, VAULT_ADDED_TO_REGISTRY)) {
    let ethTransaction = getOrCreateTransactionFromEvent(event, eventName);

    let vaultContract = VaultContract.bind(event.address);

    vaultLibrary.handleUpdateRewards(
      event.address,
      vaultContract,
      event.params.rewards,
      ethTransaction
    );
  }
}

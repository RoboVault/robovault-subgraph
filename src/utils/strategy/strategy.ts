import { log, ethereum, BigInt, Address, Bytes } from '@graphprotocol/graph-ts';
import {
  Harvest,
  Strategy,
  StrategyReport,
  Transaction,
} from '../../../generated/schema';
import { Strategy as StrategyTemplate } from '../../../generated/templates';
import { Strategy as StrategyContract } from '../../../generated/templates/Vault/Strategy';
import { booleanToString, getTimeInMillis } from '../commons';
import { BIGINT_ZERO } from '../constants';
import * as strategyReportLibrary from './strategy-report';
import * as strategyReportResultLibrary from './strategy-report-result';

export function buildId(strategyAddress: Address): string {
  return strategyAddress.toHexString();
}

export function createAndGet(
  transactionId: string,
  strategyAddress: Address,
  vault: Address,
  debtLimit: BigInt,
  rateLimit: BigInt,
  minDebtPerHarvest: BigInt,
  maxDebtPerHarvest: BigInt,
  performanceFee: BigInt,
  clonedFrom: Strategy | null,
  transaction: Transaction
): Strategy {
  log.info('[Strategy] CreateAndGet strategy {} in vault {} in TxHash {}', [
    strategyAddress.toHexString(),
    vault.toHexString(),
    transaction.hash.toHexString(),
  ]);
  let strategyContract = StrategyContract.bind(strategyAddress);
  let strategyId = buildId(strategyAddress);
  let strategy = Strategy.load(strategyId);
  if (strategy == null) {
    log.info('[Strategy] Create new strategy {} in vault {} in TxHash {}', [
      strategyAddress.toHexString(),
      vault.toHexString(),
      transaction.hash.toHexString(),
    ]);
    strategy = new Strategy(strategyId);
    strategy.inQueue = true;
    strategy.blockNumber = transaction.blockNumber;
    strategy.timestamp = getTimeInMillis(transaction.timestamp);
    strategy.transaction = transactionId;
    let tryName = strategyContract.try_name();
    strategy.name = tryName.reverted ? 'TBD' : tryName.value.toString();
    strategy.address = strategyAddress;
    strategy.vault = vault.toHexString();
    strategy.debtLimit = debtLimit;
    strategy.rateLimit = rateLimit;
    strategy.minDebtPerHarvest = minDebtPerHarvest;
    strategy.maxDebtPerHarvest = maxDebtPerHarvest;
    strategy.performanceFeeBps = performanceFee;
    strategy.clonedFrom = clonedFrom ? clonedFrom.id : null;

    let tryHealthCheck = strategyContract.try_healthCheck();
    strategy.healthCheck = tryHealthCheck.reverted
      ? null
      : tryHealthCheck.value;
    let tryDoHealthCheck = strategyContract.try_doHealthCheck();
    strategy.doHealthCheck = tryDoHealthCheck.reverted
      ? false
      : tryDoHealthCheck.value;

    strategy.save();
    StrategyTemplate.create(strategyAddress);
  }
  return strategy;
}

export function createReport(
  transaction: Transaction,
  strategyId: string,
  gain: BigInt,
  loss: BigInt,
  totalGain: BigInt,
  totalLoss: BigInt,
  totalDebt: BigInt,
  debtAdded: BigInt,
  debtLimit: BigInt,
  debtPaid: BigInt,
  event: ethereum.Event
): StrategyReport | null {
  let txHash = transaction.hash.toHexString();
  log.info('[Strategy] Create report for strategy {}', [strategyId]);
  let strategy = Strategy.load(strategyId);
  if (strategy !== null) {
    let currentReportId = strategy.latestReport;
    log.info(
      '[Strategy] Getting current report {} for strategy {}. TxHash: {}',
      [currentReportId ? currentReportId : 'null', strategy.id, txHash]
    );
    let latestReport = strategyReportLibrary.getOrCreate(
      transaction.id,
      strategy as Strategy,
      gain,
      loss,
      totalGain,
      totalLoss,
      totalDebt,
      debtAdded,
      debtLimit,
      debtPaid,
      event
    );
    strategy.latestReport = latestReport.id;
    strategy.save();

    // Getting latest report to compare to the new one and create a new report result.
    if (currentReportId !== null) {
      let currentReport = StrategyReport.load(currentReportId);
      if (currentReport !== null) {
        log.info(
          '[Strategy] Create report result (latest {} vs current {}) for strategy {}. TxHash: {}',
          [latestReport.id, currentReport.id, strategyId, txHash]
        );
        strategyReportResultLibrary.create(
          transaction,
          currentReport as StrategyReport,
          latestReport
        );
      }
    } else {
      log.info(
        '[Strategy] Report result NOT created. Only one report created {} for strategy {}. TxHash: {}',
        [latestReport.id, strategyId, txHash]
      );
    }
    return latestReport;
  } else {
    log.warning(
      '[Strategy] Failed to load strategy {} while handling StrategyReport',
      [strategyId]
    );
    return null;
  }
}

export function harvest(
  harvester: Address,
  strategyAddress: Address,
  timestamp: BigInt,
  blockNumber: BigInt,
  transactionHash: Bytes,
  transactionIndex: BigInt,
  profit: BigInt,
  loss: BigInt,
  debtPayment: BigInt,
  debtOutstanding: BigInt,
  transaction: Transaction
): Harvest {
  log.info('[Strategy] Harvest strategy {}', [strategyAddress.toHexString()]);
  let harvestId = strategyAddress
    .toHexString()
    .concat('-')
    .concat(transactionHash.toHexString())
    .concat('-')
    .concat(transactionIndex.toString());
  let harvest = Harvest.load(harvestId);

  if (harvest == null) {
    let strategyContract = StrategyContract.bind(strategyAddress);
    harvest = new Harvest(harvestId);
    harvest.timestamp = timestamp;
    harvest.blockNumber = blockNumber;
    harvest.transaction = transactionHash.toHexString();
    harvest.vault = strategyContract.vault().toHexString();
    harvest.strategy = strategyAddress.toHexString();
    harvest.harvester = harvester;
    harvest.profit = profit;
    harvest.loss = loss;
    harvest.debtPayment = debtPayment;
    harvest.debtOutstanding = debtOutstanding;
    harvest.transaction = transaction.id;
    harvest.save();
  } else {
    log.warning(
      '[Strategy] Harvest id {} FOUND for strategy {} and tx hash {}.',
      [harvestId, strategyAddress.toHexString(), transaction.hash.toHexString()]
    );
  }

  return harvest;
}

export function strategyCloned(
  clonedStrategyAddress: Address,
  fromStrategyAddress: Address,
  transaction: Transaction
): void {
  let txHash = transaction.hash.toHexString();
  log.info('[Strategy Mapping] Handle new cloned strategy {} and TX hash {}', [
    clonedStrategyAddress.toHexString(),
    txHash,
  ]);
  let strategyId = buildId(fromStrategyAddress);
  let strategyClonedFrom = Strategy.load(strategyId);
  let strategyContract = StrategyContract.bind(clonedStrategyAddress);
  let vaultAddress = strategyContract.vault();
  createAndGet(
    transaction.id,
    clonedStrategyAddress,
    vaultAddress,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    BIGINT_ZERO,
    strategyClonedFrom,
    transaction
  );
}

export function healthCheckSet(
  strategyAddress: Address,
  healthCheckAddress: Address,
  transaction: Transaction
): void {
  let txHash = transaction.hash.toHexString();
  log.info(
    '[Strategy Mapping] Handle strategy {} new health check set {} and TxHash {}',
    [strategyAddress.toHexString(), healthCheckAddress.toHexString(), txHash]
  );
  let strategyId = buildId(strategyAddress);
  let strategy = Strategy.load(strategyId);
  if (strategy !== null) {
    strategy.healthCheck = healthCheckAddress;
    strategy.save();
  } else {
    log.warning('SetHealthCheck {} Strategy {} not found in TxHash {}', [
      healthCheckAddress.toHexString(),
      strategyAddress.toHexString(),
      txHash,
    ]);
  }
}

export function doHealthCheckSet(
  strategyAddress: Address,
  doHealthCheck: boolean,
  transaction: Transaction
): void {
  let txHash = transaction.hash.toHexString();
  log.info(
    '[Strategy Mapping] Handle strategy {} new do health check set {} and TxHash {}',
    [strategyAddress.toHexString(), booleanToString(doHealthCheck), txHash]
  );
  let strategyId = buildId(strategyAddress);
  let strategy = Strategy.load(strategyId);
  if (strategy !== null) {
    strategy.doHealthCheck = doHealthCheck;
    strategy.save();
  } else {
    log.warning('SetDoHealthCheck {} Strategy {} not found in TxHash {}', [
      booleanToString(doHealthCheck),
      strategyAddress.toHexString(),
      txHash,
    ]);
  }
}

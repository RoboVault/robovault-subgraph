import {
  Strategy,
  StrategyMigration,
  Transaction,
} from '../../../generated/schema';

import { Address } from '@graphprotocol/graph-ts';

export function buildIdForStrategyMigration(
  oldStrategy: string,
  newStrategy: string
): string {
  return `${oldStrategy}-${newStrategy}`;
}

/**
 * Creates a new StrategyMigration entity.
 */
export function createMigration(
  oldStrategy: Strategy,
  newStrategyAddress: Address,
  tx: Transaction
): StrategyMigration {
  const oldId = oldStrategy.address.toHexString();
  const newId = newStrategyAddress.toHexString();
  const id: string = buildIdForStrategyMigration(oldId, newId);
  let migration = new StrategyMigration(id);
  migration.oldStrategy = oldId;
  migration.newStrategy = newId;
  migration.blockNumber = tx.blockNumber;
  migration.timestamp = tx.timestamp;
  migration.transaction = tx.id;
  migration.save();
  return migration;
}

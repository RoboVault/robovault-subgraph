import {
  BigInt,
  ethereum,
  log,
  Address,
  ByteArray,
  Bytes,
} from '@graphprotocol/graph-ts';
import { defaults } from '../default';
import { newMockEvent } from 'matchstick-as';
import {
  Harvested as HarvestedEvent,
  SetHealthCheckCall,
  SetDoHealthCheckCall,
  SetHealthCheck as SetHealthCheckEvent,
  SetDoHealthCheck as SetDoHealthCheckEvent,
  Cloned as ClonedEvent,
} from '../../generated/templates/Vault/Strategy';

export function createMockHarvestedEvent(
  transactionHash: string,
  strategyAddress: Address,
  profit: BigInt,
  loss: BigInt,
  debtPayment: BigInt,
  debtOutstanding: BigInt
): HarvestedEvent {
  let mockEvent = newMockEvent();
  mockEvent.transaction.hash = Bytes.fromByteArray(
    ByteArray.fromHexString(transactionHash)
  );
  let harvestedEvent = new HarvestedEvent(
    strategyAddress,
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );
  harvestedEvent.parameters = new Array();

  let profitParam = new ethereum.EventParam(
    'profit',
    ethereum.Value.fromUnsignedBigInt(profit)
  );
  let lossParam = new ethereum.EventParam(
    'loss',
    ethereum.Value.fromUnsignedBigInt(loss)
  );
  let debtPaymentParam = new ethereum.EventParam(
    'debtPayment',
    ethereum.Value.fromUnsignedBigInt(debtPayment)
  );
  let debtOutstandingParam = new ethereum.EventParam(
    'debtOutstanding',
    ethereum.Value.fromUnsignedBigInt(debtOutstanding)
  );

  harvestedEvent.parameters.push(profitParam);
  harvestedEvent.parameters.push(lossParam);
  harvestedEvent.parameters.push(debtPaymentParam);
  harvestedEvent.parameters.push(debtOutstandingParam);

  return harvestedEvent;
}

export function createMockSetHealthCheckEvent(
  strategyAddress: string,
  healthCheckAddress: string
): SetHealthCheckEvent {
  let mockEvent = newMockEvent();

  let setHealthCheckEvent = new SetHealthCheckEvent(
    Address.fromString(strategyAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );

  setHealthCheckEvent.parameters = new Array();
  let addressParam = new ethereum.EventParam(
    'healthCheck',
    ethereum.Value.fromAddress(Address.fromString(healthCheckAddress))
  );
  setHealthCheckEvent.parameters.push(addressParam);

  return setHealthCheckEvent;
}

export function createMockSetDoHealthCheckEvent(
  strategyAddress: string,
  doHealthCheck: boolean
): SetDoHealthCheckEvent {
  let mockEvent = newMockEvent();

  let setHealthCheckEvent = new SetDoHealthCheckEvent(
    Address.fromString(strategyAddress),
    mockEvent.logIndex,
    mockEvent.transactionLogIndex,
    mockEvent.logType,
    mockEvent.block,
    mockEvent.transaction,
    mockEvent.parameters
  );

  setHealthCheckEvent.parameters = new Array();
  let doHealthCheckParam = new ethereum.EventParam(
    'doHealthCheck',
    ethereum.Value.fromBoolean(doHealthCheck)
  );
  setHealthCheckEvent.parameters.push(doHealthCheckParam);

  return setHealthCheckEvent;
}

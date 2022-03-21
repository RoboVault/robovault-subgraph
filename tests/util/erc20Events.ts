import { Address, BigInt, ethereum } from '@graphprotocol/graph-ts';
import { Transfer as TransferEvent } from '../../generated/Registry/Vault';
import { defaults } from '../default';

export function createMockTransferEvent(
  token: string,
  from: string,
  to: string,
  amount: string,
  logIndex: string = defaults.bigInt.toString()
): TransferEvent {
  let transferEvent = new TransferEvent(
    Address.fromString(token),
    BigInt.fromString(logIndex), //logIndex
    defaults.bigInt, //txnLogIndex
    defaults.string, //logType
    defaults.block, //block
    defaults.transaction,
    [
      new ethereum.EventParam(
        'from',
        ethereum.Value.fromAddress(Address.fromString(from))
      ),
      new ethereum.EventParam(
        'to',
        ethereum.Value.fromAddress(Address.fromString(to))
      ),
      new ethereum.EventParam(
        'amount',
        ethereum.Value.fromUnsignedBigInt(BigInt.fromString(amount))
      ),
    ]
  );

  return transferEvent;
}

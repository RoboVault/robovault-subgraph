import { Deposit1Call, Withdraw1Call } from '../../generated/Registry/Vault';
import {
  BigInt,
  ethereum,
  log,
  Address,
  Bytes,
  ByteArray,
} from '@graphprotocol/graph-ts';
import { MockedFunction, newMockCall } from 'matchstick-as';

export function createMockDepositCall(
  transactionHash: Bytes,
  vaultAddress: Address,
  recipientUserAccountAddress: Address,
  sharesMinted: BigInt
): Deposit1Call {
  let mockCall = newMockCall();
  mockCall.transaction.hash = transactionHash;

  let newDepositCall = new Deposit1Call(
    vaultAddress,
    recipientUserAccountAddress,
    mockCall.block,
    mockCall.transaction,
    mockCall.inputValues,
    mockCall.outputValues
  );

  newDepositCall.outputValues = new Array();
  let sharesMintedParam = new ethereum.EventParam(
    'value0',
    ethereum.Value.fromUnsignedBigInt(sharesMinted)
  );

  newDepositCall.outputValues.push(sharesMintedParam);
  return newDepositCall;
}

export function createMockDeposit1Call(
  transactionHash: Bytes,
  vaultAddress: Address,
  recipientUserAccountAddress: Address,
  sharesMinted: BigInt,
  amountDeposited: BigInt
): Deposit1Call {
  let mockCall = newMockCall();
  mockCall.transaction.hash = transactionHash;

  let newDepositCall = new Deposit1Call(
    vaultAddress,
    recipientUserAccountAddress,
    mockCall.block,
    mockCall.transaction,
    mockCall.inputValues,
    mockCall.outputValues
  );

  newDepositCall.outputValues = new Array();
  newDepositCall.inputValues = new Array();
  let sharesMintedParam = new ethereum.EventParam(
    'value0',
    ethereum.Value.fromUnsignedBigInt(sharesMinted)
  );

  let amountDepositedParam = new ethereum.EventParam(
    '_amount',
    ethereum.Value.fromUnsignedBigInt(amountDeposited)
  );

  newDepositCall.outputValues.push(sharesMintedParam);
  newDepositCall.inputValues.push(amountDepositedParam);
  return newDepositCall;
}

export function createMockWithdraw1Call(
  transactionHash: Bytes,
  vaultAddress: Address,
  senderAddress: Address,
  sharesBurned: BigInt,
  tokensReturned: BigInt
): Withdraw1Call {
  let mockCall = newMockCall();
  mockCall.transaction.hash = transactionHash;

  let newWithdrawCall = new Withdraw1Call(
    vaultAddress,
    senderAddress,
    mockCall.block,
    mockCall.transaction,
    mockCall.inputValues,
    mockCall.outputValues
  );

  newWithdrawCall.outputValues = new Array();
  newWithdrawCall.inputValues = new Array();

  let sharesBurnedParam = new ethereum.EventParam(
    'shares',
    ethereum.Value.fromUnsignedBigInt(sharesBurned)
  );

  let tokensReturnedParam = new ethereum.EventParam(
    'value0',
    ethereum.Value.fromUnsignedBigInt(tokensReturned)
  );

  newWithdrawCall.inputValues.push(sharesBurnedParam);
  newWithdrawCall.outputValues.push(tokensReturnedParam);
  return newWithdrawCall;
}

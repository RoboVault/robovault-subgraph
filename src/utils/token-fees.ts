import {
  Account,
  Strategy,
  TokenFee,
  Transaction,
  Vault,
} from '../../generated/schema';
import { Address, BigInt, log } from '@graphprotocol/graph-ts';
import { BIGINT_ZERO } from './constants';

/* 
Checks if the transfer is a fee paid to a strategy. If so, record it in TokenFees.
Returns true if transfer is a strategist fee payment.
*/
export function isFeeToStrategy(
  vault: Vault,
  toAccount: Account,
  amount: BigInt
): boolean {
  // todo: check vault contract to see if this strategy exists.
  // otherwise, income sent to another strategy will be counted as income (delegated strategies)
  let strategy = Strategy.load(toAccount.id);
  if (strategy !== null) {
    addUnrecognizedStrategyFees(vault, amount);
    return true;
  } else {
    return false;
  }
}

/* 
Checks if the transfer is a fee paid to the treasury. If so, record it in TokenFees.
Returns true if transfer is a treasury fee payment.
*/
export function isFeeToTreasury(
  vault: Vault,
  toAccount: Account,
  amount: BigInt
): boolean {
  let toAddress = Address.fromString(toAccount.id);
  let isFeeToTreasury = toAddress.equals(vault.rewards);
  if (isFeeToTreasury) {
    addUnrecognizedTreasuryFees(vault, amount);
    return true;
  } else {
    return false;
  }
}

/* 
Used to convert unrecognized strategy fees to recognized strategy fees. 
Returns the amount of strategy fees recognized.
*/
export function recognizeStrategyFees(vault: Vault): BigInt {
  let fee = TokenFee.load(vault.id);
  if (!fee) {
    log.warning(
      '[TokenFee] No token fee object found when recognizing profit for vault {}',
      [vault.id]
    );
    fee = create(vault);
  }
  let newlyRecognizedFees = fee.unrecognizedStrategyFees;
  fee.totalStrategyFees = fee.totalStrategyFees.plus(newlyRecognizedFees);
  fee.totalFees = fee.totalFees.plus(newlyRecognizedFees);
  fee.unrecognizedStrategyFees = BIGINT_ZERO;
  fee.save();
  return newlyRecognizedFees;
}

/* 
Used to convert unrecognized treasury fees to recognized treasury fees. 
Returns the amount of treasury fees recognized.
*/
export function recognizeTreasuryFees(vault: Vault): BigInt {
  let fee = TokenFee.load(vault.id);
  if (!fee) {
    log.warning(
      '[TokenFee] No token fee object found when recognizing profit for vault {}',
      [vault.id]
    );
    fee = create(vault);
  }
  let newlyRecognizedFees = fee.unrecognizedTreasuryFees;
  fee.totalTreasuryFees = fee.totalTreasuryFees.plus(newlyRecognizedFees);
  fee.totalFees = fee.totalFees.plus(newlyRecognizedFees);
  fee.unrecognizedTreasuryFees = BIGINT_ZERO;
  fee.save();
  return newlyRecognizedFees;
}

function addUnrecognizedStrategyFees(vault: Vault, amount: BigInt): void {
  let fee = TokenFee.load(vault.id);
  if (fee === null) {
    fee = create(vault);
  }
  fee.unrecognizedStrategyFees = fee.unrecognizedStrategyFees.plus(amount);
  fee.save();
}

function addUnrecognizedTreasuryFees(vault: Vault, amount: BigInt): void {
  let fee = TokenFee.load(vault.id);
  if (fee === null) {
    fee = create(vault);
  }
  fee.unrecognizedTreasuryFees = fee.unrecognizedTreasuryFees.plus(amount);
  fee.save();
}

function create(vault: Vault): TokenFee {
  let fees = new TokenFee(vault.id);
  fees.totalStrategyFees = BIGINT_ZERO;
  fees.totalTreasuryFees = BIGINT_ZERO;
  fees.unrecognizedTreasuryFees = BIGINT_ZERO;
  fees.unrecognizedStrategyFees = BIGINT_ZERO;
  fees.totalFees = BIGINT_ZERO;
  fees.vault = vault.id;
  fees.token = vault.token;
  fees.save();
  return fees;
}

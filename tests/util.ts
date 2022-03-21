import { BigInt } from '@graphprotocol/graph-ts';

export function bigIntExponential(base: i32, exponent: BigInt): BigInt {
  let bigIntBase = BigInt.fromI32(base);
  let product = BigInt.fromI32(1);

  for (let i = 0; i < exponent.toI64(); i++) {
    product = product.times(bigIntBase);
  }
  return product;
}

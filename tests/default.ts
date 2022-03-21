import { BigInt, ethereum, Address, Bytes } from '@graphprotocol/graph-ts';

export namespace defaults {
  export const address = Address.fromString(
    '0xa16081f360e3847006db660bae1c6d1b2e17ec2a'
  );
  export const addressString = '0xa16081f360e3847006db660bae1c6d1b2e17ec2a';
  export const addressBytes = Address.fromString(
    '0xa16081f360e3847006db660bae1c6d1b2e17ec2a'
  ) as Bytes;
  export const bigInt = BigInt.fromI32(1);
  export const string = 'this is a default string';
  export const i32 = 1;
  export const block = new ethereum.Block(
    addressBytes,
    addressBytes,
    addressBytes,
    address,
    addressBytes,
    addressBytes,
    addressBytes,
    bigInt,
    bigInt,
    bigInt,
    bigInt,
    bigInt,
    bigInt,
    bigInt
  );
  export const eventDataLogType = 'default_log_type';
  export const transaction = new ethereum.Transaction(
    addressBytes,
    bigInt,
    address,
    address,
    bigInt,
    bigInt,
    bigInt,
    addressBytes
  );
}

"use strict";
import { getAddress } from "@ethersproject/address";
import { BigNumber } from "@ethersproject/bignumber";
import { arrayify, hexDataSlice, hexlify, hexZeroPad, splitSignature, stripZeros, } from "@ethersproject/bytes";
import { Zero } from "@ethersproject/constants";
import { keccak256 } from "@ethersproject/keccak256";
import { checkProperties } from "@ethersproject/properties";
import * as RLP from "@ethersproject/rlp";
import { computePublicKey, recoverPublicKey } from "@ethersproject/signing-key";
import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
const logger = new Logger(version);
///////////////////////////////
function handleAddress(value) {
    if (value === "0x") {
        return null;
    }
    return getAddress(value);
}
function handleNumber(value) {
    if (value === "0x") {
        return Zero;
    }
    return BigNumber.from(value);
}
const transactionFields = [
    { name: "nonce", maxLength: 32 },
    { name: "gasPrice", maxLength: 32 },
    { name: "gasLimit", maxLength: 32 },
    { name: "to", length: 20 },
    { name: "value", maxLength: 32 },
    { name: "data" },
];
const allowedTransactionKeys = {
    chainId: true, data: true, gasLimit: true, gasPrice: true, nonce: true, to: true, value: true
};
export function computeAddress(key) {
    let publicKey = computePublicKey(key);
    return getAddress(hexDataSlice(keccak256(hexDataSlice(publicKey, 1)), 12));
}
export function recoverAddress(digest, signature) {
    return computeAddress(recoverPublicKey(arrayify(digest), signature));
}
export function serialize(transaction, signature) {
    checkProperties(transaction, allowedTransactionKeys);
    let raw = [];
    transactionFields.forEach(function (fieldInfo) {
        let value = transaction[fieldInfo.name] || ([]);
        value = arrayify(hexlify(value));
        // Fixed-width field
        if (fieldInfo.length && value.length !== fieldInfo.length && value.length > 0) {
            logger.throwArgumentError("invalid length for " + fieldInfo.name, ("transaction:" + fieldInfo.name), value);
        }
        // Variable-width (with a maximum)
        if (fieldInfo.maxLength) {
            value = stripZeros(value);
            if (value.length > fieldInfo.maxLength) {
                logger.throwArgumentError("invalid length for " + fieldInfo.name, ("transaction:" + fieldInfo.name), value);
            }
        }
        raw.push(hexlify(value));
    });
    if (transaction.chainId != null && transaction.chainId !== 0) {
        raw.push(hexlify(transaction.chainId));
        raw.push("0x");
        raw.push("0x");
    }
    let unsignedTransaction = RLP.encode(raw);
    // Requesting an unsigned transation
    if (!signature) {
        return unsignedTransaction;
    }
    // The splitSignature will ensure the transaction has a recoveryParam in the
    // case that the signTransaction function only adds a v.
    let sig = splitSignature(signature);
    // We pushed a chainId and null r, s on for hashing only; remove those
    let v = 27 + sig.recoveryParam;
    if (raw.length === 9) {
        raw.pop();
        raw.pop();
        raw.pop();
        v += transaction.chainId * 2 + 8;
    }
    raw.push(hexlify(v));
    raw.push(stripZeros(arrayify(sig.r)));
    raw.push(stripZeros(arrayify(sig.s)));
    return RLP.encode(raw);
}
export function parse(rawTransaction) {
    let transaction = RLP.decode(rawTransaction);
    if (transaction.length !== 9 && transaction.length !== 6) {
        logger.throwArgumentError("invalid raw transaction", "rawTransactin", rawTransaction);
    }
    let tx = {
        nonce: handleNumber(transaction[0]).toNumber(),
        gasPrice: handleNumber(transaction[1]),
        gasLimit: handleNumber(transaction[2]),
        to: handleAddress(transaction[3]),
        value: handleNumber(transaction[4]),
        data: transaction[5],
        chainId: 0
    };
    // Legacy unsigned transaction
    if (transaction.length === 6) {
        return tx;
    }
    try {
        tx.v = BigNumber.from(transaction[6]).toNumber();
    }
    catch (error) {
        console.log(error);
        return tx;
    }
    tx.r = hexZeroPad(transaction[7], 32);
    tx.s = hexZeroPad(transaction[8], 32);
    if (BigNumber.from(tx.r).isZero() && BigNumber.from(tx.s).isZero()) {
        // EIP-155 unsigned transaction
        tx.chainId = tx.v;
        tx.v = 0;
    }
    else {
        // Signed Tranasaction
        tx.chainId = Math.floor((tx.v - 35) / 2);
        if (tx.chainId < 0) {
            tx.chainId = 0;
        }
        let recoveryParam = tx.v - 27;
        let raw = transaction.slice(0, 6);
        if (tx.chainId !== 0) {
            raw.push(hexlify(tx.chainId));
            raw.push("0x");
            raw.push("0x");
            recoveryParam -= tx.chainId * 2 + 8;
        }
        let digest = keccak256(RLP.encode(raw));
        try {
            tx.from = recoverAddress(digest, { r: hexlify(tx.r), s: hexlify(tx.s), recoveryParam: recoveryParam });
        }
        catch (error) {
            console.log(error);
        }
        tx.hash = keccak256(rawTransaction);
    }
    return tx;
}

"use strict";

import { BlockTag, Provider, TransactionRequest, TransactionResponse } from "@ethersproject/abstract-provider";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { Bytes, BytesLike } from "@ethersproject/bytes";
import { Deferrable, defineReadOnly, resolveProperties, shallowCopy } from "@ethersproject/properties";

import { Logger } from "@ethersproject/logger";
import { version } from "./_version";
const logger = new Logger(version);

const allowedTransactionKeys: Array<string> = [
    "accessList", "chainId", "data", "from", "gasLimit", "gasPrice", "maxFeePerGas", "maxPriorityFeePerGas", "nonce", "to", "type", "value"
];

const forwardErrors = [
    Logger.errors.INSUFFICIENT_FUNDS,
    Logger.errors.NONCE_EXPIRED,
    Logger.errors.REPLACEMENT_UNDERPRICED,
];

export interface FeeData {
    maxFeePerGas: null | BigNumber;
    maxPriorityFeePerGas: null | BigNumber;
    gasPrice: null | BigNumber;
}

// EIP-712 Typed Data
// See: https://eips.ethereum.org/EIPS/eip-712

export interface TypedDataDomain {
    name?: string;
    version?: string;
    chainId?: BigNumberish;
    verifyingContract?: string;
    salt?: BytesLike;
};

export interface TypedDataField {
    name: string;
    type: string;
};

// Sub-classes of Signer may optionally extend this interface to indicate
// they have a private key available synchronously
export interface ExternallyOwnedAccount {
    readonly address: string;
    readonly privateKey: string;
}

// Sub-Class Notes:
//  - A Signer MUST always make sure, that if present, the "from" field
//    matches the Signer, before sending or signing a transaction
//  - A Signer SHOULD always wrap private information (such as a private
//    key or mnemonic) in a function, so that console.log does not leak
//    the data

// @TODO: This is a temporary measure to preserse backwards compatibility
//        In v6, the method on TypedDataSigner will be added to Signer
export interface TypedDataSigner {
    _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string>;
}

export abstract class Signer {
    readonly provider?: Provider;

    ///////////////////
    // Sub-classes MUST implement these

    // Returns the checksum address
    abstract getAddress(): Promise<string>

    // Returns the signed prefixed-message. This MUST treat:
    // - Bytes as a binary message
    // - string as a UTF8-message
    // i.e. "0x1234" is a SIX (6) byte string, NOT 2 bytes of data
    abstract signMessage(message: Bytes | string): Promise<string>;

    // Signs a transaxction and returns the fully serialized, signed transaction.
    // The EXACT transaction MUST be signed, and NO additional properties to be added.
    // - This MAY throw if signing transactions is not supports, but if
    //   it does, sentTransaction MUST be overridden.
    abstract signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string>;

    // Returns a new instance of the Signer, connected to provider.
    // This MAY throw if changing providers is not supported.
    abstract connect(provider: Provider): Signer;

    readonly _isSigner: boolean;


    ///////////////////
    // Sub-classes MUST call super
    constructor() {
        logger.checkAbstract(new.target, Signer);
        defineReadOnly(this, "_isSigner", true);
    }


    ///////////////////
    // Sub-classes MAY override these

    async getBalance(blockTag?: BlockTag): Promise<BigNumber> {
        this._checkProvider("getBalance");
        return await this.provider.getBalance(this.getAddress(), blockTag);
    }

    async getTransactionCount(blockTag?: BlockTag): Promise<number> {
        this._checkProvider("getTransactionCount");
        return await this.provider.getTransactionCount(this.getAddress(), blockTag);
    }

    // Populates "from" if unspecified, and estimates the gas for the transation
    async estimateGas(transaction: Deferrable<TransactionRequest>): Promise<BigNumber> {
        this._checkProvider("estimateGas");
        const tx = await resolveProperties(this.checkTransaction(transaction));
        return await this.provider.estimateGas(tx);
    }

    // Populates "from" if unspecified, and calls with the transation
    async call(transaction: Deferrable<TransactionRequest>, blockTag?: BlockTag): Promise<string> {
        this._checkProvider("call");
        const tx = await resolveProperties(this.checkTransaction(transaction));
        return await this.provider.call(tx, blockTag);
    }

    // Populates all fields in a transaction, signs it and sends it to the network
    sendTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionResponse> {
        this._checkProvider("sendTransaction");
        return this.populateTransaction(transaction).then((tx) => {
            return this.signTransaction(tx).then((signedTx) => {
                return this.provider.sendTransaction(signedTx);
            });
        });
    }

    async getChainId(): Promise<number> {
        this._checkProvider("getChainId");
        const network = await this.provider.getNetwork();
        return network.chainId;
    }

    async getGasPrice(): Promise<BigNumber> {
        this._checkProvider("getGasPrice");
        return await this.provider.getGasPrice();
    }

    async getFeeData(): Promise<FeeData> {
        this._checkProvider("getFeeStats");

        const { block, gasPrice } = await resolveProperties({
            block: this.provider.getBlock(-1),
            gasPrice: this.provider.getGasPrice()
        });

        let maxFeePerGas = null, maxPriorityFeePerGas = null;

        if (block && block.baseFee) {
            maxFeePerGas = block.baseFee.mul(2);
            maxPriorityFeePerGas = BigNumber.from("1000000000");
        }

        return { maxFeePerGas, maxPriorityFeePerGas, gasPrice };
    }


    async resolveName(name: string): Promise<string> {
        this._checkProvider("resolveName");
        return await this.provider.resolveName(name);
    }



    // Checks a transaction does not contain invalid keys and if
    // no "from" is provided, populates it.
    // - does NOT require a provider
    // - adds "from" is not present
    // - returns a COPY (safe to mutate the result)
    // By default called from: (overriding these prevents it)
    //   - call
    //   - estimateGas
    //   - populateTransaction (and therefor sendTransaction)
    checkTransaction(transaction: Deferrable<TransactionRequest>): Deferrable<TransactionRequest> {
        for (const key in transaction) {
            if (allowedTransactionKeys.indexOf(key) === -1) {
                logger.throwArgumentError("invalid transaction key: " + key, "transaction", transaction);
            }
        }

        const tx = shallowCopy(transaction);

        if (tx.from == null) {
            tx.from = this.getAddress();

        } else {
            // Make sure any provided address matches this signer
            tx.from = Promise.all([
                Promise.resolve(tx.from),
                this.getAddress()
            ]).then((result) => {
                if (result[0].toLowerCase() !== result[1].toLowerCase()) {
                    logger.throwArgumentError("from address mismatch", "transaction", transaction);
                }
                return result[0];
            });
        }

        return tx;
    }

    // Populates ALL keys for a transaction and checks that "from" matches
    // this Signer. Should be used by sendTransaction but NOT by signTransaction.
    // By default called from: (overriding these prevents it)
    //   - sendTransaction
    //
    // Notes:
    //  - We allow gasPrice for EIP-1559 as long as it matches maxFeePerGas
    async populateTransaction(transaction: Deferrable<TransactionRequest>): Promise<TransactionRequest> {

        const tx: Deferrable<TransactionRequest> = await resolveProperties(this.checkTransaction(transaction))

        if (tx.to != null) {
            tx.to = Promise.resolve(tx.to).then(async (to) => {
                if (to == null) { return null; }
                const address = await this.resolveName(to);
                if (address == null) {
                    logger.throwArgumentError("provided ENS name resolves to null", "tx.to", to);
                }
                return address;
            });
        }

        if ((tx.type === 2 || tx.type == null) && (tx.maxFeePerGas != null && tx.maxPriorityFeePerGas != null)) {
            // Fully-formed EIP-1559 transaction

            // Check the gasPrice == maxFeePerGas
            if (tx.gasPrice != null && !BigNumber.from(tx.gasPrice).eq(<BigNumberish>(tx.maxFeePerGas))) {
                logger.throwArgumentError("gasPrice/maxFeePerGas mismatch", "transaction", transaction);
            }

            tx.type = 2;

        } else if (tx.type === -1 || tx.type === 1) {
            // Explicit EIP-2930 or Legacy transaction

            // Do not allow EIP-1559 properties
            if (tx.maxFeePerGas != null || tx.maxPriorityFeePerGas != null) {
                logger.throwArgumentError(`transaction type ${ tx.type } does not support eip-1559 keys`, "transaction", transaction);
            }

            if (tx.gasPrice == null) { tx.gasPrice = this.getGasPrice(); }
            tx.type = (tx.accessList ? 1: -1);

        } else {

            // We need to get fee data to determine things
            const feeData = await this.getFeeData();

            if (tx.type == null) {
                // We need to auto-detect the intended type of this transaction...

                if (feeData.maxFeePerGas != null && feeData.maxPriorityFeePerGas != null) {
                    // The network supports EIP-1559!

                    if (tx.gasPrice != null && tx.maxFeePerGas == null && tx.maxPriorityFeePerGas == null) {
                        // Legacy or EIP-2930 transaction, but without its type set
                        tx.type = (tx.accessList ? 1: -1);

                    } else {
                        // Use EIP-1559; no gas price or one EIP-1559 property was specified

                        // Check that gasPrice == maxFeePerGas
                        if (tx.gasPrice != null) {
                            // The first condition fails only if gasPrice and maxPriorityFeePerGas
                            // were specified, which is a weird thing to do
                            if (tx.maxFeePerGas == null || !BigNumber.from(tx.gasPrice).eq(<BigNumberish>(tx.maxFeePerGas))) {
                                logger.throwArgumentError("gasPrice/maxFeePerGas mismatch", "transaction", transaction);
                            }
                        }

                        tx.type = 2;
                        if (tx.maxFeePerGas == null) { tx.maxFeePerGas = feeData.maxFeePerGas; }
                        if (tx.maxPriorityFeePerGas == null) { tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas; }
                    }

                } else if (feeData.gasPrice != null) {
                    // Network doesn't support EIP-1559...

                    // ...but they are trying to use EIP-1559 properties
                    if (tx.maxFeePerGas != null || tx.maxPriorityFeePerGas != null) {
                        logger.throwError("network does not support EIP-1559", Logger.errors.UNSUPPORTED_OPERATION, {
                            operation: "populateTransaction"
                        });
                    }

                    tx.gasPrice = feeData.gasPrice;
                    tx.type = (tx.accessList ? 1: -1);

                } else {
                    // getFeeData has failed us.
                    logger.throwError("failed to get consistent fee data", Logger.errors.UNSUPPORTED_OPERATION, {
                        operation: "signer.getFeeData"
                    });
                }

            } else if (tx.type === 2) {
                // Explicitly using EIP-1559

                // Check gasPrice == maxFeePerGas
                if (tx.gasPrice != null && !BigNumber.from(tx.gasPrice).eq(<BigNumberish>(tx.maxFeePerGas))) {
                    logger.throwArgumentError("gasPrice/maxFeePerGas mismatch", "transaction", transaction);
                }

                if (tx.maxFeePerGas == null) { tx.maxFeePerGas = feeData.maxFeePerGas; }
                if (tx.maxPriorityFeePerGas == null) { tx.maxPriorityFeePerGas = feeData.maxPriorityFeePerGas; }
            }
        }

        if (tx.nonce == null) { tx.nonce = this.getTransactionCount("pending"); }

        if (tx.gasLimit == null) {
            tx.gasLimit = this.estimateGas(tx).catch((error) => {
                if (forwardErrors.indexOf(error.code) >= 0) {
                    throw error;
                }

                return logger.throwError("cannot estimate gas; transaction may fail or may require manual gas limit", Logger.errors.UNPREDICTABLE_GAS_LIMIT, {
                    error: error,
                    tx: tx
                });
            });
        }

        if (tx.chainId == null) {
            tx.chainId = this.getChainId();
        } else {
            tx.chainId = Promise.all([
                Promise.resolve(tx.chainId),
                this.getChainId()
            ]).then((results) => {
                if (results[1] !== 0 && results[0] !== results[1]) {
                    logger.throwArgumentError("chainId address mismatch", "transaction", transaction);
                }
                return results[0];
            });
        }

        return await resolveProperties(tx);
    }


    ///////////////////
    // Sub-classes SHOULD leave these alone

    _checkProvider(operation?: string): void {
        if (!this.provider) { logger.throwError("missing provider", Logger.errors.UNSUPPORTED_OPERATION, {
            operation: (operation || "_checkProvider") });
        }
    }

    static isSigner(value: any): value is Signer {
        return !!(value && value._isSigner);
    }
}

export class VoidSigner extends Signer implements TypedDataSigner {
    readonly address: string;

    constructor(address: string, provider?: Provider) {
        logger.checkNew(new.target, VoidSigner);
        super();
        defineReadOnly(this, "address", address);
        defineReadOnly(this, "provider", provider || null);
    }

    getAddress(): Promise<string> {
        return Promise.resolve(this.address);
    }

    _fail(message: string, operation: string): Promise<any> {
        return Promise.resolve().then(() => {
            logger.throwError(message, Logger.errors.UNSUPPORTED_OPERATION, { operation: operation });
        });
    }

    signMessage(message: Bytes | string): Promise<string> {
        return this._fail("VoidSigner cannot sign messages", "signMessage");
    }

    signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
        return this._fail("VoidSigner cannot sign transactions", "signTransaction");
    }

    _signTypedData(domain: TypedDataDomain, types: Record<string, Array<TypedDataField>>, value: Record<string, any>): Promise<string> {
        return this._fail("VoidSigner cannot sign typed data", "signTypedData");
    }

    connect(provider: Provider): VoidSigner {
        return new VoidSigner(this.address, provider);
    }
}


declare module "utils/errors" {
    export const UNKNOWN_ERROR = "UNKNOWN_ERROR";
    export const NOT_IMPLEMENTED = "NOT_IMPLEMENTED";
    export const MISSING_NEW = "MISSING_NEW";
    export const CALL_EXCEPTION = "CALL_EXCEPTION";
    export const INVALID_ARGUMENT = "INVALID_ARGUMENT";
    export const MISSING_ARGUMENT = "MISSING_ARGUMENT";
    export const UNEXPECTED_ARGUMENT = "UNEXPECTED_ARGUMENT";
    export const NUMERIC_FAULT = "NUMERIC_FAULT";
    export const UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION";
    export function throwError(message: string, code: string, params: any): never;
    export function checkNew(self: any, kind: any): void;
}
declare module "utils/convert" {
    /**
     *  Conversion Utilities
     *
     */
    import { BigNumber } from "utils/bignumber";
    export type Arrayish = string | ArrayLike<number>;
    export type Signature = {
        r: string;
        s: string;
        v: number;
    };
    export function isArrayish(value: any): boolean;
    export function arrayify(value: Arrayish | BigNumber): Uint8Array;
    export function concat(objects: Array<Arrayish>): Uint8Array;
    export function stripZeros(value: Arrayish): Uint8Array;
    export function padZeros(value: Arrayish, length: number): Uint8Array;
    export function isHexString(value: any, length?: number): boolean;
    export function hexlify(value: Arrayish | BigNumber | number): string;
    export function hexStripZeros(value: string): string;
    export function hexZeroPad(value: string, length: number): string;
    export function splitSignature(signature: Arrayish): Signature;
}
declare module "utils/bignumber" {
    /**
     *  BigNumber
     *
     *  A wrapper around the BN.js object. We use the BN.js library
     *  because it is used by elliptic, so it is required regardles.
     *
     */
    import _BN from 'bn.js';
    import { Arrayish } from "utils/convert";
    export type BigNumberish = BigNumber | string | number | Arrayish;
    export class BigNumber {
        readonly _bn: _BN.BN;
        constructor(value: BigNumberish);
        fromTwos(value: BigNumberish): BigNumber;
        toTwos(value: BigNumberish): BigNumber;
        add(other: BigNumberish): BigNumber;
        sub(other: BigNumberish): BigNumber;
        div(other: BigNumberish): BigNumber;
        mul(other: BigNumberish): BigNumber;
        mod(other: BigNumberish): BigNumber;
        pow(other: BigNumberish): BigNumber;
        maskn(value: BigNumberish): BigNumber;
        eq(other: BigNumberish): boolean;
        lt(other: BigNumberish): boolean;
        lte(other: BigNumberish): boolean;
        gt(other: BigNumberish): boolean;
        gte(other: BigNumberish): boolean;
        isZero(): boolean;
        toNumber(): number;
        toString(): string;
        toHexString(): string;
    }
    export function isBigNumber(value: any): boolean;
    export function bigNumberify(value: BigNumberish): BigNumber;
    export const ConstantNegativeOne: BigNumber;
    export const ConstantZero: BigNumber;
    export const ConstantOne: BigNumber;
    export const ConstantTwo: BigNumber;
    export const ConstantWeiPerEther: BigNumber;
}
declare module "utils/keccak256" {
    import { Arrayish } from "utils/convert";
    export function keccak256(data: Arrayish): string;
}
declare module "utils/rlp" {
    import { Arrayish } from "utils/convert";
    export function encode(object: any): string;
    export function decode(data: Arrayish): any;
}
declare module "utils/address" {
    import { BigNumber } from "utils/bignumber";
    import { Arrayish } from "utils/convert";
    export function getAddress(address: string, icapFormat?: boolean): string;
    export function getContractAddress(transaction: {
        from: string;
        nonce: Arrayish | BigNumber | number;
    }): string;
}
declare module "utils/utf8" {
    import { Arrayish } from "utils/convert";
    export enum UnicodeNormalizationForm {
        current = "",
        NFC = "NFC",
        NFD = "NFD",
        NFKC = "NFKC",
        NFKD = "NFKD"
    }
    export function toUtf8Bytes(str: string, form?: UnicodeNormalizationForm): Uint8Array;
    export function toUtf8String(bytes: Arrayish): string;
}
declare module "utils/abi-coder" {
    import { Arrayish } from "utils/convert";
    export type CoerceFunc = (type: string, value: any) => any;
    export type ParamType = {
        name?: string;
        type: string;
        indexed?: boolean;
        components?: Array<any>;
    };
    export function defaultCoerceFunc(type: string, value: any): any;
    export function parseSignature(fragment: string): any;
    export class AbiCoder {
        readonly coerceFunc: CoerceFunc;
        constructor(coerceFunc?: CoerceFunc);
        encode(types: Array<string | ParamType>, values: Array<any>): string;
        decode(types: Array<string | ParamType>, data: Arrayish): any;
    }
    export const defaultAbiCoder: AbiCoder;
}
declare module "utils/properties" {
    export function defineReadOnly(object: any, name: any, value: any): void;
    export function defineFrozen(object: any, name: any, value: any): void;
    export type DeferredSetter = (value: any) => void;
    export function defineDeferredReadOnly(object: any, name: any, value: any): DeferredSetter;
    export function resolveProperties(object: any): Promise<any>;
}
declare module "contracts/interface" {
    import { ParamType } from "utils/abi-coder";
    import { BigNumber, BigNumberish } from "utils/bignumber";
    export class Indexed {
        readonly hash: string;
        constructor(value: any);
    }
    export class Description {
        readonly type: string;
        readonly inputs: Array<ParamType>;
        constructor(info: any);
    }
    export class DeployDescription extends Description {
        readonly payable: boolean;
        encode(bytecode: string, params: Array<any>): string;
    }
    export class FunctionDescription extends Description {
        readonly name: string;
        readonly signature: string;
        readonly sighash: string;
        readonly outputs: Array<ParamType>;
        readonly payable: boolean;
        encode(params: Array<any>): string;
        decode(data: string): any;
    }
    export type CallTransaction = {
        args: Array<any>;
        signature: string;
        sighash: string;
        decode: (data: string) => any;
        value: BigNumber;
    };
    export class EventDescription extends Description {
        readonly name: string;
        readonly signature: string;
        readonly anonymous: boolean;
        readonly topic: string;
        decode(data: string, topics?: Array<string>): any;
    }
    export class Interface {
        readonly _abi: Array<any>;
        readonly functions: Array<FunctionDescription>;
        readonly events: Array<EventDescription>;
        readonly deployFunction: DeployDescription;
        constructor(abi: Array<string | ParamType> | string);
        parseTransaction(tx: {
            data: string;
            value?: BigNumberish;
        }): CallTransaction;
    }
}
declare module "utils/namehash" {
    export function namehash(name: string): string;
}
declare module "providers/networks" {
    export type Network = {
        name: string;
        chainId: number;
        ensAddress?: string;
    };
    export const networks: {
        "unspecified": {
            "chainId": number;
            "name": string;
        };
        "homestead": {
            "chainId": number;
            "ensAddress": string;
            "name": string;
        };
        "mainnet": {
            "chainId": number;
            "ensAddress": string;
            "name": string;
        };
        "morden": {
            "chainId": number;
            "name": string;
        };
        "ropsten": {
            "chainId": number;
            "ensAddress": string;
            "name": string;
        };
        "testnet": {
            "chainId": number;
            "ensAddress": string;
            "name": string;
        };
        "rinkeby": {
            "chainId": number;
            "name": string;
        };
        "kovan": {
            "chainId": number;
            "name": string;
        };
        "classic": {
            "chainId": number;
            "name": string;
        };
    };
    /**
     *  getNetwork
     *
     *  If the network is a the name of a common network, return that network.
     *  Otherwise, if it is a network object, verify the chain ID is valid
     *  for that network. Otherwise, return the network.
     *
     */
    export function getNetwork(network: Network | string | number): Network;
}
declare module "providers/provider" {
    import { BigNumber, BigNumberish } from "utils/bignumber";
    import { Arrayish } from "utils/convert";
    import { Network } from "providers/networks";
    export type BlockTag = string | number;
    export type Block = {
        hash: string;
        parentHash: string;
        number: number;
        timestamp: number;
        nonce: string;
        difficulty: string;
        gasLimit: BigNumber;
        gasUsed: BigNumber;
        miner: string;
        extraData: string;
        transactions: Array<string>;
    };
    export type TransactionRequest = {
        to?: string | Promise<string>;
        from?: string | Promise<string>;
        nonce?: number | string | Promise<number | string>;
        gasLimit?: BigNumberish | Promise<BigNumberish>;
        gasPrice?: BigNumberish | Promise<BigNumberish>;
        data?: Arrayish | Promise<Arrayish>;
        value?: BigNumberish | Promise<BigNumberish>;
        chainId?: number | Promise<number>;
    };
    export type TransactionResponse = {
        blockNumber?: number;
        blockHash?: string;
        hash: string;
        to?: string;
        from?: string;
        nonce?: number;
        gasLimit?: BigNumber;
        gasPrice?: BigNumber;
        data?: string;
        value: BigNumber;
        chainId?: number;
        r?: string;
        s?: string;
        v?: number;
        wait?: (timeout?: number) => Promise<TransactionResponse>;
    };
    export type TransactionReceipt = {
        contractAddress?: string;
        transactionIndex?: number;
        root?: string;
        gasUsed?: BigNumber;
        logsBloom?: string;
        blockHash?: string;
        transactionHash?: string;
        logs?: Array<Log>;
        blockNumber?: number;
        cumulativeGasUsed?: BigNumber;
        status?: number;
    };
    export type Filter = {
        fromBlock?: BlockTag;
        toBlock?: BlockTag;
        address?: string;
        topics?: Array<any>;
    };
    export type Log = {
        blockNumber?: number;
        blockHash?: string;
        transactionIndex?: number;
        removed?: boolean;
        address: string;
        data?: string;
        topics?: Array<string>;
        transactionHash?: string;
        logIndex?: number;
    };
    export function checkTransactionResponse(transaction: any): any;
    export class Provider {
        private _network;
        protected ready: Promise<Network>;
        private _events;
        protected _emitted: any;
        private _pollingInterval;
        private _poller;
        private _lastBlockNumber;
        private _balances;
        /**
         *  Sub-classing notes
         *    - If the network is standard or fully specified, ready will resolve
         *    - Otherwise, the sub-class must assign a Promise to ready
         */
        constructor(network: string | Network);
        private _doPoll;
        resetEventsBlock(blockNumber: any): void;
        readonly network: Network;
        getNetwork(): Promise<Network>;
        readonly blockNumber: number;
        polling: boolean;
        pollingInterval: number;
        waitForTransaction(transactionHash: string, timeout?: number): Promise<TransactionResponse>;
        getBlockNumber(): Promise<number>;
        getGasPrice(): Promise<BigNumber>;
        getBalance(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<BigNumber>;
        getTransactionCount(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<number>;
        getCode(addressOrName: string | Promise<string>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;
        getStorageAt(addressOrName: string | Promise<string>, position: BigNumberish | Promise<BigNumberish>, blockTag?: BlockTag | Promise<BlockTag>): Promise<string>;
        sendTransaction(signedTransaction: string | Promise<string>): Promise<string>;
        call(transaction: TransactionRequest): Promise<string>;
        estimateGas(transaction: TransactionRequest): Promise<BigNumber>;
        getBlock(blockHashOrBlockTag: BlockTag | string | Promise<BlockTag | string>): Promise<Block>;
        getTransaction(transactionHash: string): Promise<TransactionResponse>;
        getTransactionReceipt(transactionHash: string): Promise<TransactionReceipt>;
        getLogs(filter: Filter): Promise<Array<Log>>;
        getEtherPrice(): Promise<number>;
        _resolveNames(object: any, keys: any): Promise<{}>;
        _getResolver(name: any): Promise<string>;
        resolveName(name: string | Promise<string>): Promise<string>;
        lookupAddress(address: string | Promise<string>): Promise<string>;
        doPoll(): void;
        perform(method: string, params: any): Promise<any>;
        _startPending(): void;
        _stopPending(): void;
        on(eventName: any, listener: any): Provider;
        once(eventName: any, listener: any): Provider;
        emit(eventName: any, ...args: any[]): boolean;
        listenerCount(eventName?: any): number;
        listeners(eventName: any): Array<any>;
        removeAllListeners(eventName: any): Provider;
        removeListener(eventName: any, listener: any): Provider;
    }
}
declare module "contracts/contract" {
    import { Interface } from "contracts/interface";
    import { Provider, TransactionResponse } from "providers/provider";
    import { ParamType } from "utils/abi-coder";
    import { BigNumber } from "utils/bignumber";
    interface Signer {
        defaultGasLimit?: BigNumber;
        defaultGasPrice?: BigNumber;
        address?: string;
        provider?: Provider;
        getAddress(): Promise<string>;
        getTransactionCount(): Promise<number>;
        estimateGas(tx: any): Promise<BigNumber>;
        sendTransaction(tx: any): Promise<any>;
        sign(tx: any): string | Promise<string>;
    }
    export type ContractEstimate = (...params: Array<any>) => Promise<BigNumber>;
    export type ContractFunction = (...params: Array<any>) => Promise<any>;
    export type ContractEvent = (...params: Array<any>) => void;
    interface Bucket<T> {
        [name: string]: T;
    }
    export type Contractish = Array<string | ParamType> | Interface | string;
    export class Contract {
        readonly address: string;
        readonly interface: Interface;
        readonly signer: Signer;
        readonly provider: Provider;
        readonly estimate: Bucket<ContractEstimate>;
        readonly functions: Bucket<ContractFunction>;
        readonly events: Bucket<ContractEvent>;
        readonly addressPromise: Promise<string>;
        readonly deployTransaction: TransactionResponse;
        constructor(addressOrName: string, contractInterface: Contractish, signerOrProvider: Signer | Provider);
        connect(signerOrProvider: Signer | Provider): Contract;
        deploy(bytecode: string, ...args: Array<any>): Promise<Contract>;
    }
}
declare module "contracts/index" {
    import { Contract } from "contracts/contract";
    import { Interface } from "contracts/interface";
    export { Contract, Interface };
}
declare module "utils/base64" {
    import { Arrayish } from "utils/convert";
    export function decode(textData: string): Uint8Array;
    export function encode(data: Arrayish): string;
}
declare module "utils/web" {
    export type ConnectionInfo = {
        url: string;
        user?: string;
        password?: string;
        allowInsecure?: boolean;
    };
    export type ProcessFunc = (value: any) => any;
    export function fetchJson(url: string | ConnectionInfo, json: string, processFunc: ProcessFunc): Promise<any>;
}
declare module "providers/etherscan-provider" {
    import { Provider } from "providers/provider";
    import { Network } from "providers/networks";
    export class EtherscanProvider extends Provider {
        readonly baseUrl: string;
        readonly apiKey: string;
        constructor(network?: Network | string, apiKey?: string);
        perform(method: string, params: any): Promise<any>;
        getHistory(addressOrName: any, startBlock: any, endBlock: any): Promise<any[]>;
    }
}
declare module "providers/fallback-provider" {
    import { Provider } from "providers/provider";
    export class FallbackProvider extends Provider {
        private _providers;
        constructor(providers: Array<Provider>);
        readonly providers: Provider[];
        perform(method: string, params: any): any;
    }
}
declare module "providers/json-rpc-provider" {
    import { Network } from "providers/networks";
    import { BlockTag, Provider, TransactionRequest } from "providers/provider";
    import { BigNumber } from "utils/bignumber";
    import { Arrayish } from "utils/convert";
    import { ConnectionInfo } from "utils/web";
    export function hexlifyTransaction(transaction: TransactionRequest): any;
    export class JsonRpcSigner {
        readonly provider: JsonRpcProvider;
        readonly _address: string;
        constructor(provider: JsonRpcProvider, address?: string);
        readonly address: string;
        getAddress(): Promise<string>;
        getBalance(blockTag?: BlockTag): Promise<BigNumber>;
        getTransactionCount(blockTag: any): Promise<number>;
        sendTransaction(transaction: TransactionRequest): Promise<any>;
        signMessage(message: Arrayish | string): Promise<string>;
        unlock(password: any): Promise<boolean>;
    }
    export class JsonRpcProvider extends Provider {
        readonly connection: ConnectionInfo;
        private _pendingFilter;
        constructor(url?: ConnectionInfo | string, network?: Network | string);
        getSigner(address: any): JsonRpcSigner;
        listAccounts(): Promise<any>;
        send(method: any, params: any): Promise<any>;
        perform(method: any, params: any): Promise<any>;
        _startPending(): void;
        _stopPending(): void;
    }
}
declare module "providers/infura-provider" {
    import { JsonRpcProvider, JsonRpcSigner } from "providers/json-rpc-provider";
    import { Network } from "providers/networks";
    export class InfuraProvider extends JsonRpcProvider {
        readonly apiAccessToken: string;
        constructor(network?: Network | string, apiAccessToken?: string);
        _startPending(): void;
        getSigner(address?: string): JsonRpcSigner;
        listAccounts(): Promise<any[]>;
    }
}
declare module "providers/web3-provider" {
    import { Network } from "providers/networks";
    import { JsonRpcProvider } from "providers/json-rpc-provider";
    export type Callback = (error: any, response: any) => void;
    export type AsyncProvider = {
        isMetaMask: boolean;
        host?: string;
        path?: string;
        sendAsync: (request: any, callback: Callback) => void;
    };
    export class Web3Provider extends JsonRpcProvider {
        readonly _web3Provider: AsyncProvider;
        constructor(web3Provider: AsyncProvider, network?: Network | string);
        send(method: any, params: any): Promise<{}>;
    }
}
declare module "providers/index" {
    import { Provider } from "providers/provider";
    import { Network } from "providers/networks";
    import { EtherscanProvider } from "providers/etherscan-provider";
    import { FallbackProvider } from "providers/fallback-provider";
    import { InfuraProvider } from "providers/infura-provider";
    import { JsonRpcProvider } from "providers/json-rpc-provider";
    import { Web3Provider } from "providers/web3-provider";
    function getDefaultProvider(network?: Network | string): FallbackProvider;
    export { Provider, getDefaultProvider, FallbackProvider, EtherscanProvider, InfuraProvider, JsonRpcProvider, Web3Provider, };
}
declare module "utils/id" {
    export function id(text: string): string;
}
declare module "utils/sha2" {
    export function sha256(data: any): string;
    export function sha512(data: any): string;
}
declare module "utils/solidity" {
    export function pack(types: Array<string>, values: Array<any>): string;
    export function keccak256(types: Array<string>, values: Array<any>): string;
    export function sha256(types: Array<string>, values: Array<any>): string;
}
declare module "utils/random-bytes" {
    export function randomBytes(length: any): Uint8Array;
}
declare module "utils/units" {
    export function formatUnits(value: any, unitType: string | number, options?: any): string;
    export function parseUnits(value: any, unitType: any): any;
    export function formatEther(wei: any, options: any): string;
    export function parseEther(ether: any): any;
}
declare module "utils/index" {
    import { getAddress, getContractAddress } from "utils/address";
    import { AbiCoder, parseSignature } from "utils/abi-coder";
    import * as base64 from "utils/base64";
    import * as bigNumber from "utils/bignumber";
    import * as convert from "utils/convert";
    import { id } from "utils/id";
    import { keccak256 } from "utils/keccak256";
    import { namehash } from "utils/namehash";
    import * as sha2 from "utils/sha2";
    import * as solidity from "utils/solidity";
    import { randomBytes } from "utils/random-bytes";
    import * as RLP from "utils/rlp";
    import * as utf8 from "utils/utf8";
    import * as units from "utils/units";
    import { fetchJson } from "utils/web";
    const _default: {
        AbiCoder: typeof AbiCoder;
        defaultAbiCoder: AbiCoder;
        parseSignature: typeof parseSignature;
        RLP: typeof RLP;
        fetchJson: typeof fetchJson;
        etherSymbol: string;
        arrayify: typeof convert.arrayify;
        concat: typeof convert.concat;
        padZeros: typeof convert.padZeros;
        stripZeros: typeof convert.stripZeros;
        base64: typeof base64;
        bigNumberify: typeof bigNumber.bigNumberify;
        BigNumber: typeof bigNumber.BigNumber;
        hexlify: typeof convert.hexlify;
        toUtf8Bytes: typeof utf8.toUtf8Bytes;
        toUtf8String: typeof utf8.toUtf8String;
        namehash: typeof namehash;
        id: typeof id;
        getAddress: typeof getAddress;
        getContractAddress: typeof getContractAddress;
        formatEther: typeof units.formatEther;
        parseEther: typeof units.parseEther;
        formatUnits: typeof units.formatUnits;
        parseUnits: typeof units.parseUnits;
        keccak256: typeof keccak256;
        sha256: typeof sha2.sha256;
        randomBytes: typeof randomBytes;
        solidityPack: typeof solidity.pack;
        solidityKeccak256: typeof solidity.keccak256;
        soliditySha256: typeof solidity.sha256;
        splitSignature: typeof convert.splitSignature;
    };
    export default _default;
}
declare module "wallet/secp256k1" {
    export interface BN {
        toString(radix: number): string;
        encode(encoding: string, compact: boolean): Uint8Array;
        toArray(endian: string, width: number): Uint8Array;
    }
    export interface Signature {
        r: BN;
        s: BN;
        recoveryParam: number;
    }
    export interface KeyPair {
        sign(message: Uint8Array, options: {
            canonical?: boolean;
        }): Signature;
        getPublic(compressed: boolean, encoding?: string): string;
        getPublic(): BN;
        getPrivate(encoding?: string): string;
        encode(encoding: string, compressed: boolean): string;
        priv: BN;
    }
    export interface EC {
        constructor(curve: string): any;
        n: BN;
        keyFromPublic(publicKey: string | Uint8Array): KeyPair;
        keyFromPrivate(privateKey: string | Uint8Array): KeyPair;
        recoverPubKey(data: Uint8Array, signature: {
            r: Uint8Array;
            s: Uint8Array;
        }, recoveryParam: number): KeyPair;
    }
    export const curve: EC;
}
declare module "wallet/words" {
    const words = "AbandonAbilityAbleAboutAboveAbsentAbsorbAbstractAbsurdAbuseAccessAccidentAccountAccuseAchieveAcidAcousticAcquireAcrossActActionActorActressActualAdaptAddAddictAddressAdjustAdmitAdultAdvanceAdviceAerobicAffairAffordAfraidAgainAgeAgentAgreeAheadAimAirAirportAisleAlarmAlbumAlcoholAlertAlienAllAlleyAllowAlmostAloneAlphaAlreadyAlsoAlterAlwaysAmateurAmazingAmongAmountAmusedAnalystAnchorAncientAngerAngleAngryAnimalAnkleAnnounceAnnualAnotherAnswerAntennaAntiqueAnxietyAnyApartApologyAppearAppleApproveAprilArchArcticAreaArenaArgueArmArmedArmorArmyAroundArrangeArrestArriveArrowArtArtefactArtistArtworkAskAspectAssaultAssetAssistAssumeAsthmaAthleteAtomAttackAttendAttitudeAttractAuctionAuditAugustAuntAuthorAutoAutumnAverageAvocadoAvoidAwakeAwareAwayAwesomeAwfulAwkwardAxisBabyBachelorBaconBadgeBagBalanceBalconyBallBambooBananaBannerBarBarelyBargainBarrelBaseBasicBasketBattleBeachBeanBeautyBecauseBecomeBeefBeforeBeginBehaveBehindBelieveBelowBeltBenchBenefitBestBetrayBetterBetweenBeyondBicycleBidBikeBindBiologyBirdBirthBitterBlackBladeBlameBlanketBlastBleakBlessBlindBloodBlossomBlouseBlueBlurBlushBoardBoatBodyBoilBombBoneBonusBookBoostBorderBoringBorrowBossBottomBounceBoxBoyBracketBrainBrandBrassBraveBreadBreezeBrickBridgeBriefBrightBringBriskBroccoliBrokenBronzeBroomBrotherBrownBrushBubbleBuddyBudgetBuffaloBuildBulbBulkBulletBundleBunkerBurdenBurgerBurstBusBusinessBusyButterBuyerBuzzCabbageCabinCableCactusCageCakeCallCalmCameraCampCanCanalCancelCandyCannonCanoeCanvasCanyonCapableCapitalCaptainCarCarbonCardCargoCarpetCarryCartCaseCashCasinoCastleCasualCatCatalogCatchCategoryCattleCaughtCauseCautionCaveCeilingCeleryCementCensusCenturyCerealCertainChairChalkChampionChangeChaosChapterChargeChaseChatCheapCheckCheeseChefCherryChestChickenChiefChildChimneyChoiceChooseChronicChuckleChunkChurnCigarCinnamonCircleCitizenCityCivilClaimClapClarifyClawClayCleanClerkCleverClickClientCliffClimbClinicClipClockClogCloseClothCloudClownClubClumpClusterClutchCoachCoastCoconutCodeCoffeeCoilCoinCollectColorColumnCombineComeComfortComicCommonCompanyConcertConductConfirmCongressConnectConsiderControlConvinceCookCoolCopperCopyCoralCoreCornCorrectCostCottonCouchCountryCoupleCourseCousinCoverCoyoteCrackCradleCraftCramCraneCrashCraterCrawlCrazyCreamCreditCreekCrewCricketCrimeCrispCriticCropCrossCrouchCrowdCrucialCruelCruiseCrumbleCrunchCrushCryCrystalCubeCultureCupCupboardCuriousCurrentCurtainCurveCushionCustomCuteCycleDadDamageDampDanceDangerDaringDashDaughterDawnDayDealDebateDebrisDecadeDecemberDecideDeclineDecorateDecreaseDeerDefenseDefineDefyDegreeDelayDeliverDemandDemiseDenialDentistDenyDepartDependDepositDepthDeputyDeriveDescribeDesertDesignDeskDespairDestroyDetailDetectDevelopDeviceDevoteDiagramDialDiamondDiaryDiceDieselDietDifferDigitalDignityDilemmaDinnerDinosaurDirectDirtDisagreeDiscoverDiseaseDishDismissDisorderDisplayDistanceDivertDivideDivorceDizzyDoctorDocumentDogDollDolphinDomainDonateDonkeyDonorDoorDoseDoubleDoveDraftDragonDramaDrasticDrawDreamDressDriftDrillDrinkDripDriveDropDrumDryDuckDumbDuneDuringDustDutchDutyDwarfDynamicEagerEagleEarlyEarnEarthEasilyEastEasyEchoEcologyEconomyEdgeEditEducateEffortEggEightEitherElbowElderElectricElegantElementElephantElevatorEliteElseEmbarkEmbodyEmbraceEmergeEmotionEmployEmpowerEmptyEnableEnactEndEndlessEndorseEnemyEnergyEnforceEngageEngineEnhanceEnjoyEnlistEnoughEnrichEnrollEnsureEnterEntireEntryEnvelopeEpisodeEqualEquipEraEraseErodeErosionErrorEruptEscapeEssayEssenceEstateEternalEthicsEvidenceEvilEvokeEvolveExactExampleExcessExchangeExciteExcludeExcuseExecuteExerciseExhaustExhibitExileExistExitExoticExpandExpectExpireExplainExposeExpressExtendExtraEyeEyebrowFabricFaceFacultyFadeFaintFaithFallFalseFameFamilyFamousFanFancyFantasyFarmFashionFatFatalFatherFatigueFaultFavoriteFeatureFebruaryFederalFeeFeedFeelFemaleFenceFestivalFetchFeverFewFiberFictionFieldFigureFileFilmFilterFinalFindFineFingerFinishFireFirmFirstFiscalFishFitFitnessFixFlagFlameFlashFlatFlavorFleeFlightFlipFloatFlockFloorFlowerFluidFlushFlyFoamFocusFogFoilFoldFollowFoodFootForceForestForgetForkFortuneForumForwardFossilFosterFoundFoxFragileFrameFrequentFreshFriendFringeFrogFrontFrostFrownFrozenFruitFuelFunFunnyFurnaceFuryFutureGadgetGainGalaxyGalleryGameGapGarageGarbageGardenGarlicGarmentGasGaspGateGatherGaugeGazeGeneralGeniusGenreGentleGenuineGestureGhostGiantGiftGiggleGingerGiraffeGirlGiveGladGlanceGlareGlassGlideGlimpseGlobeGloomGloryGloveGlowGlueGoatGoddessGoldGoodGooseGorillaGospelGossipGovernGownGrabGraceGrainGrantGrapeGrassGravityGreatGreenGridGriefGritGroceryGroupGrowGruntGuardGuessGuideGuiltGuitarGunGymHabitHairHalfHammerHamsterHandHappyHarborHardHarshHarvestHatHaveHawkHazardHeadHealthHeartHeavyHedgehogHeightHelloHelmetHelpHenHeroHiddenHighHillHintHipHireHistoryHobbyHockeyHoldHoleHolidayHollowHomeHoneyHoodHopeHornHorrorHorseHospitalHostHotelHourHoverHubHugeHumanHumbleHumorHundredHungryHuntHurdleHurryHurtHusbandHybridIceIconIdeaIdentifyIdleIgnoreIllIllegalIllnessImageImitateImmenseImmuneImpactImposeImproveImpulseInchIncludeIncomeIncreaseIndexIndicateIndoorIndustryInfantInflictInformInhaleInheritInitialInjectInjuryInmateInnerInnocentInputInquiryInsaneInsectInsideInspireInstallIntactInterestIntoInvestInviteInvolveIronIslandIsolateIssueItemIvoryJacketJaguarJarJazzJealousJeansJellyJewelJobJoinJokeJourneyJoyJudgeJuiceJumpJungleJuniorJunkJustKangarooKeenKeepKetchupKeyKickKidKidneyKindKingdomKissKitKitchenKiteKittenKiwiKneeKnifeKnockKnowLabLabelLaborLadderLadyLakeLampLanguageLaptopLargeLaterLatinLaughLaundryLavaLawLawnLawsuitLayerLazyLeaderLeafLearnLeaveLectureLeftLegLegalLegendLeisureLemonLendLengthLensLeopardLessonLetterLevelLiarLibertyLibraryLicenseLifeLiftLightLikeLimbLimitLinkLionLiquidListLittleLiveLizardLoadLoanLobsterLocalLockLogicLonelyLongLoopLotteryLoudLoungeLoveLoyalLuckyLuggageLumberLunarLunchLuxuryLyricsMachineMadMagicMagnetMaidMailMainMajorMakeMammalManManageMandateMangoMansionManualMapleMarbleMarchMarginMarineMarketMarriageMaskMassMasterMatchMaterialMathMatrixMatterMaximumMazeMeadowMeanMeasureMeatMechanicMedalMediaMelodyMeltMemberMemoryMentionMenuMercyMergeMeritMerryMeshMessageMetalMethodMiddleMidnightMilkMillionMimicMindMinimumMinorMinuteMiracleMirrorMiseryMissMistakeMixMixedMixtureMobileModelModifyMomMomentMonitorMonkeyMonsterMonthMoonMoralMoreMorningMosquitoMotherMotionMotorMountainMouseMoveMovieMuchMuffinMuleMultiplyMuscleMuseumMushroomMusicMustMutualMyselfMysteryMythNaiveNameNapkinNarrowNastyNationNatureNearNeckNeedNegativeNeglectNeitherNephewNerveNestNetNetworkNeutralNeverNewsNextNiceNightNobleNoiseNomineeNoodleNormalNorthNoseNotableNoteNothingNoticeNovelNowNuclearNumberNurseNutOakObeyObjectObligeObscureObserveObtainObviousOccurOceanOctoberOdorOffOfferOfficeOftenOilOkayOldOliveOlympicOmitOnceOneOnionOnlineOnlyOpenOperaOpinionOpposeOptionOrangeOrbitOrchardOrderOrdinaryOrganOrientOriginalOrphanOstrichOtherOutdoorOuterOutputOutsideOvalOvenOverOwnOwnerOxygenOysterOzonePactPaddlePagePairPalacePalmPandaPanelPanicPantherPaperParadeParentParkParrotPartyPassPatchPathPatientPatrolPatternPausePavePaymentPeacePeanutPearPeasantPelicanPenPenaltyPencilPeoplePepperPerfectPermitPersonPetPhonePhotoPhrasePhysicalPianoPicnicPicturePiecePigPigeonPillPilotPinkPioneerPipePistolPitchPizzaPlacePlanetPlasticPlatePlayPleasePledgePluckPlugPlungePoemPoetPointPolarPolePolicePondPonyPoolPopularPortionPositionPossiblePostPotatoPotteryPovertyPowderPowerPracticePraisePredictPreferPreparePresentPrettyPreventPricePridePrimaryPrintPriorityPrisonPrivatePrizeProblemProcessProduceProfitProgramProjectPromoteProofPropertyProsperProtectProudProvidePublicPuddingPullPulpPulsePumpkinPunchPupilPuppyPurchasePurityPurposePursePushPutPuzzlePyramidQualityQuantumQuarterQuestionQuickQuitQuizQuoteRabbitRaccoonRaceRackRadarRadioRailRainRaiseRallyRampRanchRandomRangeRapidRareRateRatherRavenRawRazorReadyRealReasonRebelRebuildRecallReceiveRecipeRecordRecycleReduceReflectReformRefuseRegionRegretRegularRejectRelaxReleaseReliefRelyRemainRememberRemindRemoveRenderRenewRentReopenRepairRepeatReplaceReportRequireRescueResembleResistResourceResponseResultRetireRetreatReturnReunionRevealReviewRewardRhythmRibRibbonRiceRichRideRidgeRifleRightRigidRingRiotRippleRiskRitualRivalRiverRoadRoastRobotRobustRocketRomanceRoofRookieRoomRoseRotateRoughRoundRouteRoyalRubberRudeRugRuleRunRunwayRuralSadSaddleSadnessSafeSailSaladSalmonSalonSaltSaluteSameSampleSandSatisfySatoshiSauceSausageSaveSayScaleScanScareScatterSceneSchemeSchoolScienceScissorsScorpionScoutScrapScreenScriptScrubSeaSearchSeasonSeatSecondSecretSectionSecuritySeedSeekSegmentSelectSellSeminarSeniorSenseSentenceSeriesServiceSessionSettleSetupSevenShadowShaftShallowShareShedShellSheriffShieldShiftShineShipShiverShockShoeShootShopShortShoulderShoveShrimpShrugShuffleShySiblingSickSideSiegeSightSignSilentSilkSillySilverSimilarSimpleSinceSingSirenSisterSituateSixSizeSkateSketchSkiSkillSkinSkirtSkullSlabSlamSleepSlenderSliceSlideSlightSlimSloganSlotSlowSlushSmallSmartSmileSmokeSmoothSnackSnakeSnapSniffSnowSoapSoccerSocialSockSodaSoftSolarSoldierSolidSolutionSolveSomeoneSongSoonSorrySortSoulSoundSoupSourceSouthSpaceSpareSpatialSpawnSpeakSpecialSpeedSpellSpendSphereSpiceSpiderSpikeSpinSpiritSplitSpoilSponsorSpoonSportSpotSpraySpreadSpringSpySquareSqueezeSquirrelStableStadiumStaffStageStairsStampStandStartStateStaySteakSteelStemStepStereoStickStillStingStockStomachStoneStoolStoryStoveStrategyStreetStrikeStrongStruggleStudentStuffStumbleStyleSubjectSubmitSubwaySuccessSuchSuddenSufferSugarSuggestSuitSummerSunSunnySunsetSuperSupplySupremeSureSurfaceSurgeSurpriseSurroundSurveySuspectSustainSwallowSwampSwapSwarmSwearSweetSwiftSwimSwingSwitchSwordSymbolSymptomSyrupSystemTableTackleTagTailTalentTalkTankTapeTargetTaskTasteTattooTaxiTeachTeamTellTenTenantTennisTentTermTestTextThankThatThemeThenTheoryThereTheyThingThisThoughtThreeThriveThrowThumbThunderTicketTideTigerTiltTimberTimeTinyTipTiredTissueTitleToastTobaccoTodayToddlerToeTogetherToiletTokenTomatoTomorrowToneTongueTonightToolToothTopTopicToppleTorchTornadoTortoiseTossTotalTouristTowardTowerTownToyTrackTradeTrafficTragicTrainTransferTrapTrashTravelTrayTreatTreeTrendTrialTribeTrickTriggerTrimTripTrophyTroubleTruckTrueTrulyTrumpetTrustTruthTryTubeTuitionTumbleTunaTunnelTurkeyTurnTurtleTwelveTwentyTwiceTwinTwistTwoTypeTypicalUglyUmbrellaUnableUnawareUncleUncoverUnderUndoUnfairUnfoldUnhappyUniformUniqueUnitUniverseUnknownUnlockUntilUnusualUnveilUpdateUpgradeUpholdUponUpperUpsetUrbanUrgeUsageUseUsedUsefulUselessUsualUtilityVacantVacuumVagueValidValleyValveVanVanishVaporVariousVastVaultVehicleVelvetVendorVentureVenueVerbVerifyVersionVeryVesselVeteranViableVibrantViciousVictoryVideoViewVillageVintageViolinVirtualVirusVisaVisitVisualVitalVividVocalVoiceVoidVolcanoVolumeVoteVoyageWageWagonWaitWalkWallWalnutWantWarfareWarmWarriorWashWaspWasteWaterWaveWayWealthWeaponWearWeaselWeatherWebWeddingWeekendWeirdWelcomeWestWetWhaleWhatWheatWheelWhenWhereWhipWhisperWideWidthWifeWildWillWinWindowWineWingWinkWinnerWinterWireWisdomWiseWishWitnessWolfWomanWonderWoodWoolWordWorkWorldWorryWorthWrapWreckWrestleWristWriteWrongYardYearYellowYouYoungYouthZebraZeroZoneZoo";
    export default words;
}
declare module "utils/hmac" {
    import { Arrayish } from "utils/convert";
    interface HashFunc {
        (): HashFunc;
        update(chunk: Uint8Array): HashFunc;
        digest(encoding: string): string;
        digest(): Uint8Array;
    }
    export interface HmacFunc extends HashFunc {
        (hashFunc: HashFunc, key: Arrayish): HmacFunc;
    }
    export function createSha256Hmac(key: Arrayish): HmacFunc;
    export function createSha512Hmac(key: Arrayish): HmacFunc;
}
declare module "utils/pbkdf2" {
    import { Arrayish } from "utils/convert";
    import { HmacFunc } from "utils/hmac";
    export interface CreateHmacFunc {
        (key: Arrayish): HmacFunc;
    }
    export function pbkdf2(password: Arrayish, salt: Arrayish, iterations: number, keylen: number, createHmac: CreateHmacFunc): Uint8Array;
}
declare module "wallet/hdnode" {
    import * as secp256k1 from "wallet/secp256k1";
    export class HDNode {
        private readonly keyPair;
        readonly privateKey: string;
        readonly publicKey: string;
        readonly mnemonic: string;
        readonly path: string;
        readonly chainCode: string;
        readonly index: number;
        readonly depth: number;
        constructor(keyPair: secp256k1.KeyPair, chainCode: Uint8Array, index: number, depth: number, mnemonic: string, path: string);
        private _derive;
        derivePath(path: string): HDNode;
    }
    export function fromMnemonic(mnemonic: string): HDNode;
    export function fromSeed(seed: any): HDNode;
    export function mnemonicToSeed(mnemonic: string, password?: string): string;
    export function mnemonicToEntropy(mnemonic: string): string;
    export function entropyToMnemonic(entropy: any): string;
    export function isValidMnemonic(mnemonic: string): boolean;
}
declare module "wallet/signing-key" {
    export class SigningKey {
        readonly privateKey: string;
        readonly publicKey: string;
        readonly address: string;
        readonly mnemonic: string;
        readonly path: string;
        private readonly keyPair;
        constructor(privateKey: any);
        signDigest(digest: any): {
            recoveryParam: number;
            r: string;
            s: string;
        };
        static recover(digest: any, r: any, s: any, recoveryParam: any): string;
        static getPublicKey(value: any, compressed: any): string;
        static publicKeyToAddress(publicKey: any): string;
    }
}
declare module "wallet/secret-storage" {
    import { Arrayish } from "utils/convert";
    import { SigningKey } from "wallet/signing-key";
    export interface ProgressCallback {
        (percent: number): void;
    }
    export function isCrowdsaleWallet(json: string): boolean;
    export function isValidWallet(json: string): boolean;
    export function decryptCrowdsale(json: string, password: Arrayish | string): SigningKey;
    export function decrypt(json: string, password: any, progressCallback?: ProgressCallback): Promise<SigningKey>;
    export function encrypt(privateKey: Arrayish | SigningKey, password: Arrayish | string, options?: any, progressCallback?: ProgressCallback): Promise<{}>;
}
declare module "wallet/wallet" {
    import { BigNumber } from "utils/bignumber";
    import { Arrayish } from "utils/convert";
    import { HDNode } from "wallet/hdnode";
    import { SigningKey } from "wallet/signing-key";
    interface Provider {
        chainId: number;
        getBalance(address: string, blockTag: number | string): Promise<BigNumber>;
        getTransactionCount(address: string, blockTag: number | string): Promise<number>;
        estimateGas(transaction: any): Promise<BigNumber>;
        getGasPrice(): Promise<BigNumber>;
        sendTransaction(Bytes: any): Promise<string>;
        resolveName(address: string): Promise<string>;
        waitForTransaction(Bytes32: any): Promise<TransactionResponse>;
    }
    interface TransactionRequest {
        nonce?: number;
        to?: string;
        from?: string;
        data?: string;
        gasLimit?: BigNumber;
        gasPrice?: BigNumber;
        r?: string;
        s?: string;
        chainId?: number;
        v?: number;
        value?: BigNumber;
    }
    interface TransactionResponse extends TransactionRequest {
        hash?: string;
        blockHash?: string;
        block?: number;
        wait?: (timeout?: number) => Promise<TransactionResponse>;
    }
    export class Wallet {
        readonly address: string;
        readonly privateKey: string;
        private mnemonic;
        private path;
        private readonly signingKey;
        provider: any;
        defaultGasLimit: number;
        constructor(privateKey: SigningKey | HDNode | Arrayish, provider?: Provider);
        sign(transaction: TransactionRequest): string;
        static parseTransaction(rawTransaction: Arrayish): TransactionRequest;
        getAddress(): Promise<string>;
        getBalance(blockTag: any): any;
        getTransactionCount(blockTag: any): any;
        estimateGas(transaction: TransactionRequest): any;
        sendTransaction(transaction: any): Promise<any>;
        send(addressOrName: any, amountWei: any, options: any): Promise<any>;
        static hashMessage(message: any): string;
        signMessage(message: any): string;
        static verifyMessage(message: any, signature: any): string;
        encrypt(password: any, options: any, progressCallback: any): Promise<{}>;
        static createRandom(options: any): Wallet;
        static isEncryptedWallet(json: string): boolean;
        static fromEncryptedWallet(json: any, password: any, progressCallback: any): Promise<{}>;
        static fromMnemonic(mnemonic: string, path?: string): Wallet;
        static fromBrainWallet(username: Arrayish | string, password: Arrayish | string, progressCallback: any): Promise<{}>;
    }
}
declare module "wallet/index" {
    import { Wallet } from "wallet/wallet";
    import * as HDNode from "wallet/hdnode";
    import { SigningKey } from "wallet/signing-key";
    export { HDNode, SigningKey, Wallet };
}
declare module "index" {
    import { Contract, Interface } from "contracts/index";
    import * as providers from "providers/index";
    import * as errors from "utils/errors";
    import utils from "utils/index";
    import { HDNode, SigningKey, Wallet } from "wallet/index";
    export { Wallet, HDNode, SigningKey, Contract, Interface, providers, errors, utils, };
}
declare module "providers/ipc-provider" {
    import { JsonRpcProvider } from "providers/json-rpc-provider";
    import { Network } from "providers/networks";
    export class IpcProvider extends JsonRpcProvider {
        readonly path: string;
        constructor(path: string, network?: Network | string);
        send(method: any, params: any): Promise<{}>;
    }
}
//# sourceMappingURL=ethers.d.ts.map
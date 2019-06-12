export declare const UNKNOWN_ERROR = "UNKNOWN_ERROR";
export declare const NOT_IMPLEMENTED = "NOT_IMPLEMENTED";
export declare const UNSUPPORTED_OPERATION = "UNSUPPORTED_OPERATION";
export declare const NETWORK_ERROR = "NETWORK_ERROR";
export declare const SERVER_ERROR = "SERVER_ERROR";
export declare const TIMEOUT = "TIMEOUT";
export declare const BUFFER_OVERRUN = "BUFFER_OVERRUN";
export declare const NUMERIC_FAULT = "NUMERIC_FAULT";
export declare const MISSING_NEW = "MISSING_NEW";
export declare const INVALID_ARGUMENT = "INVALID_ARGUMENT";
export declare const MISSING_ARGUMENT = "MISSING_ARGUMENT";
export declare const UNEXPECTED_ARGUMENT = "UNEXPECTED_ARGUMENT";
export declare const CALL_EXCEPTION = "CALL_EXCEPTION";
export declare const INSUFFICIENT_FUNDS = "INSUFFICIENT_FUNDS";
export declare const NONCE_EXPIRED = "NONCE_EXPIRED";
export declare const REPLACEMENT_UNDERPRICED = "REPLACEMENT_UNDERPRICED";
export declare const UNPREDICTABLE_GAS_LIMIT = "UNPREDICTABLE_GAS_LIMIT";
export declare function setCensorship(censorship: boolean, permanent?: boolean): void;
export declare function makeError(message: string, code: string, params: any): Error;
export declare function throwError(message: string, code: string, params: any): never;
export declare function throwArgumentError(message: string, name: string, value: any): never;
export declare function checkArgumentCount(count: number, expectedCount: number, suffix?: string): void;
export declare function checkNew(target: any, kind: any): void;
export declare function checkAbstract(target: any, kind: any): void;
export declare function checkNormalize(): void;
export declare function checkSafeUint53(value: number, message?: string): void;
export declare function setLogLevel(logLevel: string): void;
export declare function warn(...args: Array<any>): void;
export declare function info(...args: Array<any>): void;

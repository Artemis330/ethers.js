'use strict';
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var contracts_1 = require("./contracts");
exports.Contract = contracts_1.Contract;
exports.Interface = contracts_1.Interface;
var providers = __importStar(require("./providers"));
exports.providers = providers;
var wallet_1 = require("./wallet");
exports.HDNode = wallet_1.HDNode;
exports.SigningKey = wallet_1.SigningKey;
exports.Wallet = wallet_1.Wallet;
var abi_coder_1 = require("./utils/abi-coder");
exports.AbiCoder = abi_coder_1.AbiCoder;
var bignumber_1 = require("./utils/bignumber");
exports.BigNumber = bignumber_1.BigNumber;
var constants = __importStar(require("./utils/constants"));
exports.constants = constants;
var errors = __importStar(require("./utils/errors"));
exports.errors = errors;
var utils = __importStar(require("./utils"));
exports.utils = utils;
var types = __importStar(require("./types"));
exports.types = types;
var wordlists = __importStar(require("./wordlists"));
exports.wordlists = wordlists;
// This is empty in node, and used by browserify to inject extra goodies
var shims_1 = require("./utils/shims");
exports.platform = shims_1.platform;
// This is generated by "npm run dist"
var _version_1 = require("./_version");
exports.version = _version_1.version;
function getDefaultProvider(network) {
    return new providers.FallbackProvider([
        new providers.InfuraProvider(network),
        new providers.EtherscanProvider(network),
    ]);
}
exports.getDefaultProvider = getDefaultProvider;

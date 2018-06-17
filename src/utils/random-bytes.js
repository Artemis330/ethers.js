'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var convert_1 = require("./convert");
var crypto_1 = require("crypto");
//function _randomBytes(length) { return "0x00"; }
function randomBytes(length) {
    return convert_1.arrayify(crypto_1.randomBytes(length));
}
exports.randomBytes = randomBytes;

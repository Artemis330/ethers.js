'use strict';

var assert = require('assert');

var utils = require('./utils');
var ethers = utils.getEthers(__filename);


function equals(actual, expected) {

    // Array (treat recursively)
    if (Array.isArray(actual)) {
        if (!Array.isArray(expected) || actual.length !== expected.length) { return false; }
        for (var i = 0; i < actual.length; i++) {
            if (!equals(actual[i], expected[i])) { return false; }
        }
        return true;
    }

    if (typeof(actual) === 'number') { actual = utils.bigNumberify(actual); }
    if (typeof(expected) === 'number') { expected = utils.bigNumberify(expected); }

    // BigNumber
    if (actual.eq) {
        if (typeof(expected) === 'string' && expected.match(/^-?0x[0-9A-Fa-f]*$/)) {
            var neg = (expected.substring(0, 1) === '-');
            if (neg) { expected = expected.substring(1); }
            expected = utils.bigNumberify(expected);
            if (neg) { expected = expected.mul(-1); }
        }
        if (!actual.eq(expected)) { return false; }
        return true;
    }

    // Uint8Array
    if (expected.buffer) {
        if (!utils.isHexString(actual)) { return false; }
        actual = utils.arrayify(actual);

        if (!actual.buffer || actual.length !== expected.length) { return false; }
        for (var i = 0; i < actual.length; i++) {
            if (actual[i] !== expected[i]) { return false; }
        }

        return true;
    }

    // Maybe address?
    try {
        var actualAddress = ethers.utils.getAddress(actual);
        var expectedAddress = ethers.utils.getAddress(expected);
        return (actualAddress === expectedAddress);
    } catch (error) { }

    // Something else
    return (actual === expected);
}


function getValues(object, format, named) {
   if (Array.isArray(object)) {
       var result = [];
       object.forEach(function(object) {
           result.push(getValues(object, format, named));
       });
       return result;
   }

   switch (object.type) {
       case 'number':
           return utils.bigNumberify(object.value);

       case 'boolean':
       case 'string':
           return object.value;

       case 'buffer':
           return utils.arrayify(object.value);

       case 'tuple':
           var result = getValues(object.value, format, named);
           if (named) {
               var namedResult = {};
               result.forEach(function(value, index) {
                   namedResult['r' + String(index)] = value;
               });
               return namedResult;
           }
           return result;

       default:
           throw new Error('invalid type - ' + object.type);
   }
}

describe('ABI Coder Encoding', function() {
    var coder = ethers.utils.defaultAbiCoder;

    var tests = utils.loadTests('contract-interface');
    tests.forEach(function(test) {
        var values = getValues(JSON.parse(test.normalizedValues));
        var types = JSON.parse(test.types);
        var result = test.result;

        var title = test.name + ' => (' + test.types + ') = (' + test.normalizedValues + ')';

        it(('encodes paramters - ' + test.name + ' - ' + test.types), function() {
            this.timeout(120000);
            var encoded = coder.encode(types, values);
            assert.equal(encoded, result, 'encoded data - ' + title);
        });
    });
});

describe('ABI Coder Decoding', function() {
    var coder = ethers.utils.defaultAbiCoder;

    var tests = utils.loadTests('contract-interface');
    tests.forEach(function(test) {
        var values = getValues(JSON.parse(test.normalizedValues));
        var types = JSON.parse(test.types);
        var result = test.result;

        var title = test.name + ' => (' + test.types + ') = (' + test.normalizedValues + ')';

        it(('decodes parameters - ' + test.name + ' - ' + test.types), function() {
            this.timeout(120000);

            var decoded = coder.decode(types, result);

            assert.ok(equals(decoded, values), 'decoded parameters - ' + title);
        });
    });
});

describe('ABI Coder ABIv2 Encoding', function() {
    var coder = ethers.utils.defaultAbiCoder;

    var tests = utils.loadTests('contract-interface-abi2');
    tests.forEach(function(test) {
        var values = getValues(JSON.parse(test.values));
        var namedValues = getValues(JSON.parse(test.values), undefined, true);
        var types = JSON.parse(test.types);
        var expected = test.result;
        var title = test.name + ' => (' + test.types + ') = (' + test.value + ')';

        it(('encodes ABIv2 parameters - ' + test.name + ' - ' + test.types), function() {
            this.timeout(120000);

            var encoded = coder.encode(types, values);
            assert.equal(encoded, expected, 'encoded positional parameters - ' + title);

            var namedEncoded = coder.encode(types, values);
            assert.equal(namedEncoded, expected, 'encoded named parameters - ' + title);
        });
    });
});

describe('ABI Coder ABIv2 Decoding', function() {
    var coder = ethers.utils.defaultAbiCoder;

    var tests = utils.loadTests('contract-interface-abi2');
    tests.forEach(function(test) {
        var values = getValues(JSON.parse(test.values));
        var types = JSON.parse(test.types);
        var result = test.result;
        var title = test.name + ' => (' + test.types + ') = (' + test.values + ')';

        it(('decodes ABIv2 parameters - ' + test.name + ' - ' + test.types), function() {
            this.timeout(120000);

            var decoded = coder.decode(types, result);
            assert.ok(equals(decoded, values), 'decoded positional parameters - ' + title);
        });
    });
});

describe('Test Contract Events', function() {

    var tests = utils.loadTests('contract-events');
    tests.forEach(function(test, index) {
        it(('decodes event parameters - ' + test.name + ' - ' + test.types), function() {
            this.timeout(120000);

            var contract = new ethers.Interface(test.interface);
            var event = contract.events.testEvent;
            var parsed = event.decode(test.data, test.topics);

            test.normalizedValues.forEach(function(expected, index) {
                if (test.hashed[index]) {
                    assert.ok(equals(parsed[index].hash, expected), 'parsed event indexed parameter matches - ' + index);
                } else {
                    assert.ok(equals(parsed[index], expected), 'parsed event parameter matches - ' + index);
                }
            });
        });
    });

    tests.forEach(function(test, index) {
        it(('decodes event data - ' + test.name + ' - ' + test.types), function() {
            this.timeout(120000);

            var contract = new ethers.Interface(test.interface);
            var event = contract.events.testEvent;
            var parsed = event.decode(test.data);

            test.normalizedValues.forEach(function(expected, index) {
                if (test.indexed[index]) {
                    assert.ok((ethers.Interface.isIndexed(parsed[index]) && parsed[index].hash == null), 'parsed event data has empty Indexed - ' + index);
                } else {
                    assert.ok(equals(parsed[index], expected), 'parsed event data matches - ' + index);
                }
            });
        });
    });

});

describe('Test Interface Signatures', function() {
    var Interface = ethers.Interface;

    var tests = utils.loadTests('contract-signatures');
    tests.forEach(function(test) {
        var contract = new Interface(test.abi);
        it('derives the correct signature - ' + test.name, function() {
            this.timeout(120000);

            assert.equal(contract.functions.testSig.signature, test.signature,
                'derived the correct signature');
            assert.equal(contract.functions.testSig.sighash, test.sigHash,
                'derived the correct signature hash');
        })
    });
});

describe('Test Number Coder', function() {
    var coder = ethers.utils.defaultAbiCoder;
    var bnify = ethers.utils.bigNumberify;

    it('null input failed', function() {
        this.timeout(120000);

        assert.throws(function() {
            var result = coder.decode([ 'bool' ], '0x');
            console.log(result);
        }, function(error) {
            assert.equal(error.reason, 'insufficient data for boolean type', 'got invalid bool');
            return true;
        }, 'null bytes throws an error');
    });

    var overflowAboveHex      = '0x10000000000000000000000000000000000000000000000000000000000000000';
    var overflowBelowHex      = '-0x10000000000000000000000000000000000000000000000000000000000000000';
    var maxHex                =  '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    var maxLessOneHex         =  '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe'
    var maxSignedHex          =  '0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    var maxSignedLessOneHex   =  '0x7ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe'
    var minSignedHex          = '-0x8000000000000000000000000000000000000000000000000000000000000000'
    var minSignedHex2s        =  '0x8000000000000000000000000000000000000000000000000000000000000000'
    var minMoreOneSignedHex   = '-0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
    var minMoreOneSignedHex2s =  '0x8000000000000000000000000000000000000000000000000000000000000001'
    var zeroHex               =  '0x0000000000000000000000000000000000000000000000000000000000000000';
    var oneHex                =  '0x0000000000000000000000000000000000000000000000000000000000000001';

    it('encodes zero', function() {
        var ZeroValues = [
            {n: 'number zero', v: 0},
            { n: 'hex zero', v: '0x0' },
            { n: 'hex leading even length', v: '0x0000' },
            { n: 'hex leading odd length', v: '0x00000' },
            { n: 'BigNumber', v: ethers.constants.Zero }
        ];

        var expected = zeroHex;

        ['uint8', 'uint256', 'int8', 'int256'].forEach(function(type) {
            ZeroValues.forEach(function(value) {
                var result = coder.encode([ type ], [ value.v ]);
                assert.equal(result, expected, value.n + ' ' + type);
            });
        });
    });

    it('encodes one', function() {
        var ZeroValues = [
            {n: 'number', v: 1},
            { n: 'hex', v: '0x1' },
            { n: 'hex leading even length', v: '0x0001' },
            { n: 'hex leading odd length', v: '0x00001' },
            { n: 'BigNumber', v: ethers.constants.One }
        ];

        var expected = oneHex;

        ['uint8', 'uint256', 'int8', 'int256'].forEach(function(type) {
            ZeroValues.forEach(function(value) {
                var result = coder.encode([ type ], [ value.v ]);
                assert.equal(result, expected, value.n + ' ' + type);
            });
        });
    });

    it('encodes negative one', function() {
        var Values = [
            {n: 'number', v: -1},
            { n: 'hex', v: '-0x1' },
            { n: 'hex leading even length', v: '-0x0001' },
            { n: 'hex leading odd length', v: '-0x00001' },
            { n: 'BigNumber', v: ethers.constants.NegativeOne }
        ];

        var expected = maxHex;

        ['int8', 'int256'].forEach(function(type) {
            Values.forEach(function(value) {
                var result = coder.encode([ type ], [ value.v ]);
                assert.equal(result, expected, value.n + ' ' + type);
            });
        });
    });

    it('encodes full uint8 range', function() {
        for (var i = 0; i < 256; i++) {
            var expected = '0x00000000000000000000000000000000000000000000000000000000000000';
            expected += ethers.utils.hexlify(i).substring(2);
            var result = coder.encode([ 'uint8' ], [ i ]);
            assert.equal(result, expected, 'int8 ' + i);
        }
    });

    it('encodes full int8 range', function() {
        for (var i = -128; i < 128; i++) {
            var expected = null;
            if (i === -128) {
                expected = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff80';
            } else if (i < 0) {
                expected = '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
                expected += ethers.utils.hexlify(256 + i).substring(2);
            } else {
                expected = '0x00000000000000000000000000000000000000000000000000000000000000';
                expected += ethers.utils.hexlify(i).substring(2);
            }
            var result = coder.encode([ 'int8' ], [ i ]);
            assert.equal(result, expected, 'int8 ' + i);
        }
    });

    it('encodes uint256 end range', function() {
        assert.equal(coder.encode([ 'uint256' ], [ bnify(maxHex) ]), maxHex, 'uint256 max');
        assert.equal(coder.encode([ 'uint256' ], [ bnify(maxLessOneHex) ]), maxLessOneHex, 'uint256 max');
    });

    it('encodes int256 end ranges', function() {
        assert.equal(coder.encode([ 'int256' ], [ bnify(maxSignedHex) ]), maxSignedHex, 'int256 max');
        assert.equal(coder.encode([ 'int256' ], [ bnify(maxSignedLessOneHex) ]), maxSignedLessOneHex, 'int256 max');
        assert.equal(coder.encode([ 'int256' ], [ bnify(minSignedHex) ]), minSignedHex2s, 'int256 max');
        assert.equal(coder.encode([ 'int256' ], [ bnify(minMoreOneSignedHex) ]), minMoreOneSignedHex2s, 'int256 max');
    });

    it('fails to encode out-of-range uint8', function() {
        [-128, -127, -2, -1, 256, 1000, bnify(maxHex), bnify(maxSignedHex).add(1), bnify(minSignedHex), bnify(overflowAboveHex), bnify(overflowBelowHex)].forEach(function(value) {

            assert.throws(function() {
                var result = coder.encode([ 'uint8' ], [ value ]);
                console.log('RESULT', value, result);
            }, function(error) {
                assert.equal(error.reason, 'invalid number value', 'wrong error');
                return true;
            }, 'out-of-range numbers throw an error');
        });
    });

    it('fails to encode out-of-range int8', function() {
        [-129, -130, -1000, 128, 129, 1000, bnify(maxHex), bnify(maxSignedHex).add(1), bnify(minSignedHex).sub(1), bnify(overflowAboveHex), bnify(overflowBelowHex)].forEach(function(value) {

            assert.throws(function() {
                var result = coder.encode([ 'int8' ], [ value ]);
                console.log('RESULT', value, result);
            }, function(error) {
                assert.equal(error.reason, 'invalid number value', 'wrong error');
                return true;
            }, 'out-of-range numbers throw an error');
        });
    });

    it('fails to encode out-of-range uint256', function() {
        [-128, -127, -2, -1, bnify(maxHex).add(1), bnify('-' + maxHex), bnify(overflowAboveHex), bnify(overflowBelowHex)].forEach(function(value) {

            assert.throws(function() {
                var result = coder.encode([ 'uint256' ], [ value ]);
                console.log('RESULT', value, result);
            }, function(error) {
                assert.equal(error.reason, 'invalid number value', 'wrong error');
                return true;
            }, 'out-of-range numbers throw an error');
        });
    });

    it('fails to encode out-of-range int256', function() {
        [bnify(maxHex), bnify(maxSignedHex).add(1), bnify(minSignedHex).sub(1), bnify(overflowAboveHex), bnify(overflowBelowHex)].forEach(function(value, index) {

            assert.throws(function() {
                var result = coder.encode([ 'int256' ], [ value ]);
                console.log('RESULT', index, value, result);
            }, function(error) {
                assert.equal(error.reason, 'invalid number value', 'wrong error');
                return true;
            }, 'out-of-range numbers throw an error');
        });
    });

});

describe('Test Fixed Bytes Coder', function() {
    var coder = ethers.utils.defaultAbiCoder;
    var bnify = ethers.utils.bigNumberify;

    var zeroHex =  '0x0000000000000000000000000000000000000000000000000000000000000000';

    it('fails to encode out-of-range bytes4', function() {
        ['0x', '0x00000', '0x000', zeroHex, '0x12345', '0x123456', '0x123', '0x12'].forEach(function(value, index) {
            assert.throws(function() {
                var result = coder.encode([ 'bytes4' ], [ value ]);
                console.log('RESULT', index, value, result);
            }, function(error) {
                assert.equal(error.reason, 'invalid bytes4 value', 'wrong error');
                return true;
            }, 'out-of-range fixed bytes throw an error');
        });
    });

    it('fails to encode out-of-range bytes32', function() {
        ['0x', '0x00000', '0x000', '0x12345', '0x123456', (zeroHex + '0'), (zeroHex + '00')].forEach(function(value, index) {
            assert.throws(function() {
                var result = coder.encode([ 'bytes32' ], [ value ]);
                console.log('RESULT', index, value, result);
            }, function(error) {
                assert.equal(error.reason, 'invalid bytes32 value', 'wrong error');
                return true;
            }, 'out-of-range fixed bytes throw an error');
        });
    });
});

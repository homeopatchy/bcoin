/*!
 * jobs.js - worker jobs for bcoin
 * Copyright (c) 2014-2016, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var ec = require('../crypto/ec');
var scrypt = require('../crypto/scrypt');
var mine = require('../miner/mine');

/**
 * Jobs to execute within the worker.
 * @memberof Workers
 * @const {Object}
 */

var jobs = exports;

/**
 * Master process.
 * @type {Master}
 */

jobs.master = null;

/**
 * Execute tx.verify() on worker.
 * @see TX#verify
 * @param {TX} tx
 * @param {VerifyFlags} flags
 * @returns {Boolean}
 */

jobs.verify = function verify(tx, flags) {
  return tx.verify(flags);
};

/**
 * Execute tx.verifyInput() on worker.
 * @see TX#verifyInput
 * @param {TX} tx
 * @param {Number} index
 * @param {VerifyFlags} flags
 * @returns {Boolean}
 */

jobs.verifyInput = function verifyInput(tx, index, flags) {
  return tx.verifyInput(index, flags);
};

/**
 * Execute tx.sign() on worker.
 * @see MTX#sign
 * @param {MTX} tx
 * @param {KeyRing[]} ring
 * @param {SighashType} type
 */

jobs.sign = function sign(tx, ring, type) {
  var total = tx.sign(ring, type);
  var sigs = [];
  var i, input;

  for (i = 0; i < tx.inputs.length; i++) {
    input = tx.inputs[i];
    sigs.push([input.script, input.witness]);
  }

  return [sigs, total];
};

/**
 * Execute tx.signInput() on worker.
 * @see MTX#signInput
 * @param {MTX} tx
 * @param {Number} index
 * @param {Buffer} key
 * @param {SighashType} type
 */

jobs.signInput = function signInput(tx, index, key, type) {
  var result = tx.signInput(tx, index, key, type);
  var input = tx.inputs[index];

  if (!result)
    return null;

  return [input.script, input.witness];
};

/**
 * Execute ec.verify() on worker.
 * @see ec.verify
 * @param {TX} tx
 * @param {VerifyFlags} flags
 * @returns {Boolean}
 */

jobs.ecVerify = function ecVerify(msg, sig, key) {
  return ec.verify(msg, sig, key);
};

/**
 * Execute ec.sign() on worker.
 * @see ec.sign
 * @param {TX} tx
 * @param {Number} index
 * @param {VerifyFlags} flags
 * @returns {Boolean}
 */

jobs.ecSign = function ecSign(msg, key) {
  return ec.sign(msg, key);
};

/**
 * Mine a block on worker.
 * @param {Buffer} data
 * @param {Buffer} target
 * @param {Number} min
 * @param {Number} max
 * @returns {Number}
 */

jobs.mine = function _mine(data, target, min, max) {
  return mine(data, target, min, max);
};

/**
 * Execute scrypt() on worker.
 * @see scrypt
 * @param {Buffer} passwd
 * @param {Buffer} salt
 * @param {Number} N
 * @param {Number} r
 * @param {Number} p
 * @param {Number} len
 * @returns {Buffer}
 */

jobs.scrypt = function _scrypt(passwd, salt, N, r, p, len) {
  return scrypt(passwd, salt, N, r, p, len);
};

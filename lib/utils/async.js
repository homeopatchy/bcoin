/*!
 * async.js - async object class for bcoin
 * Copyright (c) 2016, Christopher Jeffrey (MIT License).
 * https://github.com/bcoin-org/bcoin
 */

'use strict';

var utils = require('../utils/utils');
var co = require('../utils/co');
var assert = require('assert');
var EventEmitter = require('events').EventEmitter;

/**
 * An abstract object that handles state and
 * provides recallable open and close methods.
 * @constructor
 * @property {Boolean} loading
 * @property {Boolean} closing
 * @property {Boolean} loaded
 */

function AsyncObject() {
  assert(this instanceof AsyncObject);

  EventEmitter.call(this);

  this.loading = false;
  this.closing = false;
  this.loaded = false;
  this.locker = null;
}

utils.inherits(AsyncObject, EventEmitter);

/**
 * Open the object (recallable).
 * @returns {Promise}
 */

AsyncObject.prototype.open = co(function* open() {
  var err, unlock;

  assert(!this.closing, 'Cannot open while closing.');

  if (this.loaded)
    return yield co.wait();

  if (this.loading)
    return yield this._onOpen();

  if (this.locker)
    unlock = yield this.locker.lock();

  this.emit('preopen');

  this.loading = true;

  try {
    yield this._open();
  } catch (e) {
    err = e;
  }

  yield co.wait();

  if (err) {
    this.loading = false;
    this._error('open', err);
    if (unlock)
      unlock();
    throw err;
  }

  this.loading = false;
  this.loaded = true;
  this.emit('open');

  if (unlock)
    unlock();
});

/**
 * Close the object (recallable).
 * @returns {Promise}
 */

AsyncObject.prototype.close = co(function* close() {
  var unlock, err;

  assert(!this.loading, 'Cannot close while loading.');

  if (!this.loaded)
    return yield co.wait();

  if (this.closing)
    return yield this._onClose();

  if (this.locker)
    unlock = yield this.locker.lock();

  this.emit('preclose');

  this.closing = true;
  this.loaded = false;

  try {
    yield this._close();
  } catch (e) {
    err = e;
  }

  yield co.wait();

  if (err) {
    this.closing = false;
    this._error('close', err);
    if (unlock)
      unlock();
    throw err;
  }

  this.closing = false;
  this.emit('close');

  if (unlock)
    unlock();
});

/**
 * Close the object (recallable).
 * @method
 * @returns {Promise}
 */

AsyncObject.prototype.destroy = AsyncObject.prototype.close;

/**
 * Emit an error for `open` or `close` listeners.
 * @private
 * @param {String} event
 * @param {Error} err
 */

AsyncObject.prototype._error = function _error(event, err) {
  var listeners = this.listeners(event);
  var i;

  this.removeAllListeners(event);

  for (i = 0; i < listeners.length; i++)
    listeners[i](err);

  this.emit('error', err);
};

/**
 * Initialize the object.
 * @private
 * @returns {Promise}
 */

AsyncObject.prototype._open = function _open(callback) {
  throw new Error('Abstract method.');
};

/**
 * Close the object.
 * @private
 * @returns {Promise}
 */

AsyncObject.prototype._close = function _close(callback) {
  throw new Error('Abstract method.');
};

/**
 * Wait for open event.
 * @private
 * @returns {Promise}
 */

AsyncObject.prototype._onOpen = function _onOpen() {
  var self = this;
  return new Promise(function(resolve, reject) {
    return self.once('open', resolve);
  });
};

/**
 * Wait for close event.
 * @private
 * @returns {Promise}
 */

AsyncObject.prototype._onClose = function _onClose() {
  var self = this;
  return new Promise(function(resolve, reject) {
    return self.once('close', resolve);
  });
};

/*
 * Expose
 */

module.exports = AsyncObject;

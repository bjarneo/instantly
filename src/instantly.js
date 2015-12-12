'use strict';

var isString = require('lodash.isstring');
var isFunction = require('lodash.isfunction');

function Instantly(channel, opts) {
    if (!channel) {
        throw new TypeError('You need to provide a channel we can listen to!');
    } else {
        this.channel = channel;
    }

    if (!window.EventSource) {
        throw new Error('EventSource is not defined in the window object. Use a polyfill.');
    }

    if (opts && opts.retries) {
        this.retries = opts.retries;
    } else {
        this.retries = 5;
    }

    if (opts && opts.timeout) {
        this.timeout = opts.timeout;
    } else {
        this.timeout = 15000;
    }

    if (opts && isFunction(opts.error)) {
        this.errorHandler = opts.error;
    }

    this.initialized = false;
    this.callbacks = {};
}

Instantly.prototype = {
    internalRetry: 0,

    on: function(event, callback) {
        if (!isFunction(callback)) {
            throw new TypeError('Callback is not a function');
        }

        if (!isString(event)) {
            throw new TypeError('Event is not a string');
        }

        this.callbacks[event] = callback;
    },

    listen: function() {
        this.es = new EventSource(this.channel);

        this.es.addEventListener('open', this.open.bind(this));
        this.es.addEventListener('error', this.error.bind(this));

        for (var event in this.callbacks) {
            if (!this.callbacks.hasOwnProperty(event)) {
                return;
            }

            this.es.addEventListener(event, this.callbacks[event]);
        }
    },

    retry: function() {
        if (this.initialized || this.internalRetry === this.retries) {
            return;
        }

        setTimeout(function() {
            this.listen();

            this.internalRetry++;
        }.bind(this), this.timeout);
    },

    open: function() {
        this.initialized = true;
        this.internalRetry = 0;
    },

    close: function() {
        this.es.close();

        this.initialized = false;
    },

    error: function() {
        this.close();

        this.retry();

        if (this.errorHandler) {
            this.errorHandler.call(this);
        }
    }
};

module.exports = Instantly;

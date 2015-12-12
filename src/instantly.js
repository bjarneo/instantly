'use strict';

var isString = require('lodash.isstring');
var isFunction = require('lodash.isfunction');

function Instantly(channel, opts) {
    if (!channel) {
        throw new TypeError('You need to provide a channel we can listen to!');
    } else {
        this.channel = channel;
    }

    if (!opts) {
        opts = {};
    }

    this.retries = opts.retries || 5;
    this.timeout = opts.timeout || 15000;

    if (opts.closeConnNotFocus) {
        document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
    }

    if (isFunction(opts.error)) {
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
        if (!window.EventSource) {
            return;
        }

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
    },

    onVisibilityChange: function() {
        if (document.hidden) {
            this.close();
        } else {
            this.listen();
        }
    }
};

module.exports = Instantly;

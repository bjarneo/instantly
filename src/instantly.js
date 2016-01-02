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

    if (opts.injectEventSourceNode) {
        this.EventSource = opts.injectEventSourceNode;
    } else if (typeof window !== 'undefined' && window.EventSource) {
        this.EventSource = window.EventSource;
    }

    this.origin = opts.origin || null;
    this.retries = opts.retries || 5;
    this.timeout = opts.timeout || 15000;
    this.errorHandler = isFunction(opts.error) ? opts.error : null;
    this.onOpen = isFunction(opts.open) ? opts.open : null;
    this.onClose = isFunction(opts.close) ? opts.close : null;

    if (opts.closeConnNotFocus) {
        document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
    }
}

Instantly.prototype = {
    initialized: false,

    callbacks: {},

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
        if (!this.EventSource) {
            return;
        }

        this.es = new this.EventSource(this.channel);

        this.es.addEventListener('open', this.open.bind(this));
        this.es.addEventListener('error', this.error.bind(this));

        for (var event in this.callbacks) {
            if (!this.callbacks.hasOwnProperty(event)) {
                return;
            }

            this.generateCallback(event);
        }
    },

    generateCallback: function(event) {
        this.es.addEventListener(event, function(e) {
            if (this.origin && e.origin !== this.origin) {
                return;
            }

            if (e.id === 'CLOSE' || e.lastEventId === 'CLOSE') {
                this.close();
            }

            this.callbacks[event].call(null, e);
        }.bind(this));
    },

    retry: function() {
        if (this.initialized || this.internalRetry === this.retries) {
            return;
        }

        setTimeout(function reconnect() {
            this.listen();

            this.internalRetry++;
        }.bind(this), this.timeout);
    },

    open: function(e) {
        this.initialized = true;

        this.internalRetry = 0;

        if (this.onOpen) {
            this.onOpen.call(null, e);
        }
    },

    close: function() {
        this.es.close();

        this.initialized = false;

        if (this.onClose) {
            this.onClose.call(null);
        }
    },

    error: function(err) {
        this.close();

        this.retry();

        if (this.errorHandler) {
            this.errorHandler.call(null, err);
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

'use strict';

var isString = require('lodash.isstring');
var isFunction = require('lodash.isfunction');

function instantly(channel, opts) {
    if (!channel) {
        throw new TypeError('You need to provide a channel we can listen to!');
    }

    if (!opts) {
        opts = {};
    }

    var EventSource;
    if (opts.injectEventSourceNode) {
        EventSource = opts.injectEventSourceNode;
    } else if (typeof window !== 'undefined' && window.EventSource) {
        EventSource = window.EventSource;
    }

    var origin = opts.origin || null;
    var retries = opts.retries || 5;
    var timeout = opts.timeout || 15000;
    var errorHandler = isFunction(opts.error) ? opts.error : null;
    var onOpen = isFunction(opts.open) ? opts.open : null;
    var onClose = isFunction(opts.close) ? opts.close : null;

    if (opts.closeConnNotFocus && typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', onVisibilityChange);
    }

    var initialized = false;
    var callbacks = {};
    var internalRetry = 0;
    var es;

    function on(event, callback) {
        if (!isFunction(callback)) {
            throw new TypeError('Callback is not a function');
        }

        if (!isString(event)) {
            throw new TypeError('Event is not a string');
        }

        callbacks[event] = callback;
    }

    function listen() {
        if (!EventSource) {
            return;
        }

        es = new EventSource(channel);

        es.addEventListener('open', open);
        es.addEventListener('error', error);

        for (var event in callbacks) {
            if (!callbacks.hasOwnProperty(event)) {
                return;
            }

            generateCallback(event);
        }
    }

    function generateCallback(event) {
        es.addEventListener(event, function(e) {
            if (origin && e.origin !== origin) {
                return;
            }

            if (e.id === 'CLOSE' || e.lastEventId === 'CLOSE') {
                close();
            }

            callbacks[event].call(null, e);
        });
    }

    function retry() {
        if (initialized || internalRetry === retries) {
            return;
        }

        setTimeout(function reconnect() {
            listen();

            internalRetry++;
        }, timeout);
    }

    function open(e) {
        initialized = true;

        internalRetry = 0;

        if (onOpen) {
            onOpen.call(null, e);
        }
    }

    function close() {
        es.close();

        initialized = false;

        if (onClose) {
            onClose.call(null);
        }
    }

    function error(err) {
        close();

        retry();

        if (errorHandler) {
            errorHandler.call(null, err);
        }
    }

    function onVisibilityChange() {
        if (document.hidden) {
            close();
        } else {
            listen();
        }
    }

    return {
        on: on,
        listen: listen,
        // Should not be exposed. Rewrite for tests.
        generateCallback: generateCallback,
        retry: retry,
        // Should not be exposed. Rewrite for tests.
        close: close,
        // Should not be exposed. Rewrite for tests.
        error: error
    };
}

module.exports = instantly;

const isString = str => typeof str === 'string';
const isFunction = func => typeof func === 'function';

class Instantly {
    constructor(channel, opts) {
        if (!channel) {
            throw new TypeError('You need to provide a channel we can listen to!');
        }

        this.channel = channel;

        if (!opts) {
            opts = {};
        }

        if (opts.injectEventSourceNode) {
            this.EventSource = opts.injectEventSourceNode;
        } else if (typeof window !== 'undefined' && window.EventSource) {
            this.EventSource = window.EventSource;
        }

        this.initialized = false;
        this.callbacks = {};
        this.internalRetry = 0;

        this.origin = opts.origin || null;
        this.retries = opts.retries || 5;
        this.timeout = opts.timeout || 15000;
        this.errorHandler = isFunction(opts.error) ? opts.error : null;
        this.onOpen = isFunction(opts.open) ? opts.open : null;
        this.onClose = isFunction(opts.close) ? opts.close : null;

        if (opts.closeConnNotFocus && typeof document !== 'undefined') {
            document.addEventListener('visibilitychange', this.onVisibilityChange.bind(this));
        }
    }

    on(event, callback) {
        if (!isFunction(callback)) {
            throw new TypeError('Callback is not a function');
        }

        if (!isString(event)) {
            throw new TypeError('Event is not a string');
        }

        this.callbacks[event] = callback;
    }

    listen() {
        if (!this.EventSource) {
            return;
        }

        this.es = new this.EventSource(this.channel);

        this.es.addEventListener('open', this.open.bind(this));
        this.es.addEventListener('error', this.error.bind(this));

        for (let event in this.callbacks) {
            if (!this.callbacks.hasOwnProperty(event)) {
                return;
            }

            this.generateCallback(event);
        }
    }

    generateCallback(event) {
        this.es.addEventListener(
            event,
            function(e) {
                if (this.origin && e.origin !== this.origin) {
                    return;
                }

                if (e.id === 'CLOSE' || e.lastEventId === 'CLOSE') {
                    this.close();
                }

                this.callbacks[event].call(null, e);
            }.bind(this)
        );
    }

    retry() {
        if (this.initialized || this.internalRetry === this.retries) {
            return;
        }

        setTimeout(
            function reconnect() {
                this.listen();

                this.internalRetry++;
            }.bind(this),
            this.timeout
        );
    }

    open(e) {
        this.initialized = true;

        this.internalRetry = 0;

        if (this.onOpen) {
            this.onOpen.call(null, e);
        }
    }

    close() {
        this.es.close();

        this.initialized = false;

        if (this.onClose) {
            this.onClose.call(null);
        }
    }

    error(err) {
        this.close();

        this.retry();

        if (this.errorHandler) {
            this.errorHandler.call(null, err);
        }
    }

    onVisibilityChange() {
        if (document.hidden) {
            this.close();
        } else {
            this.listen();
        }
    }
}

module.exports = Instantly;

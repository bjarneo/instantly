'use strict';

var assert = require('assert');
var http = require('http');
var EventSource = require('eventsource');
var SseChannel = require('sse-channel');
var Instantly = require('../src/instantly');

var endpoint = 'http://127.0.0.1:7788/channel/test';
var port = 7788;
var ip = '127.0.0.1';

describe('instantly', function() {
    this.timeout(10000);

    var es, server;

    function startServer(event) {
        var channel = new SseChannel();
        // Prevent done from running twice
        var timeout = Math.floor(Math.random() * 2000) + 1000;
        var params = {
            id: timeout,
            data: 'testing instantly'
        };

        if (event === 'CLOSE') {
            params.id = event;
        } else {
            params.event = event ? event : 'message';
        }

        setInterval(function broadcast() {
            channel.send(params);
        }, timeout);

        server = http.createServer(function(req, res) {
            if (req.url.indexOf('/channel/test') === 0) {
                channel.addClient(req, res);
            } else {
                res.writeHead(404);
                res.end();
            }
        }).listen(port, ip);
    }

    afterEach(function(done) {
        if (server) {
            server.close();
        }

        if (es && es.es) {
            es.close();
        }

        done();
    });

    it('should connect to the channel and recieve data', function(done) {
        startServer();

        es = new Instantly(endpoint, {
            injectEventSourceNode: EventSource
        });

        es.on('message', function getMessage(msg) {
            assert.equal(msg.data, 'testing instantly');

            done();
        });

        es.listen();
    });

    it('should connect to the channel and recieve data from custom event', function(done) {
        startServer('custom-event');

        es = new Instantly(endpoint, {
            injectEventSourceNode: EventSource
        });

        es.on('custom-event', function getMessage(msg) {
            assert.equal(msg.data, 'testing instantly');

            done();
        });

        es.listen();
    });

    it('should run open callback when a connection is open', function(done) {
        startServer();

        es = new Instantly(endpoint, {
            injectEventSourceNode: EventSource,
            open: function() {
                assert.equal('should run', 'should run');

                done();
            }
        });

        es.listen();
    });

    it('should run error callback when an error occur', function(done) {
        startServer();

        es = new Instantly(endpoint, {
            injectEventSourceNode: EventSource,
            error: function() {
                assert.equal('should run', 'should run');

                done();
            }
        });

        es.listen();

        es.error();
    });

    it('should close the connection when an error occur', function(done) {
        startServer();

        var isClosed = true;

        es = new Instantly(endpoint, {
            injectEventSourceNode: EventSource,
            close: function() {
                assert.equal('should run', 'should run');

                if (isClosed) {
                    isClosed = false;

                    done();
                }
            }
        });

        es.listen();

        es.close();
    });

    it('should throw TypeError exception if channel is not set', function(done) {
        assert.throws(function() {
            es = new Instantly();
        }, /You need to provide a channel we can listen to!/);

        done();
    });

    it('should throw TypeError exception if event is not a string', function() {
        startServer();

        var instantly = new Instantly(endpoint, {
            injectEventSourceNode: EventSource
        });

        assert.throws(function() {
            instantly.on(null, function() {});
        }, /Event is not a string/);

        assert.throws(function() {
            instantly.on({}, function() {});
        }, /Event is not a string/);

        assert.throws(function() {
            instantly.on(undefined, function() {});
        }, /Event is not a string/);

        assert.throws(function() {
            instantly.on(12312, function() {});
        }, /Event is not a string/);
    });

    it('should throw TypeError exception if callback is not a function', function() {
        startServer();

        var instantly = new Instantly(endpoint, {
            injectEventSourceNode: EventSource
        });

        assert.throws(function() {
            instantly.on('event');
        }, /Callback is not a function/);

        assert.throws(function() {
            instantly.on('event', 'string');
        }, /Callback is not a function/);

        assert.throws(function() {
            instantly.on('event', {});
        }, /Callback is not a function/);
    });

    it('should close the connection if an id "CLOSE" is sent by server', function(done) {
        startServer('CLOSE');

        var isClosed = true;

        es = new Instantly(endpoint, {
            injectEventSourceNode: EventSource,
            close: function() {
                assert.equal('closing', 'closing');

                if (isClosed) {
                    isClosed = false;

                    done();
                }
            }
        });

        es.on('message', function() {});

        es.listen();
    });

    it('should generate event callback', function(done) {
        startServer('test');

        es = new Instantly(endpoint, {
            injectEventSourceNode: EventSource
        });

        es.listen();

        es.on('test', function() {
            assert.equal('generate callback', 'generate callback');

            done();
        });

        es.generateCallback('test');
    });

    it('should return undefined if eventsource doesn\'t exist', function(done) {
        startServer();

        es = new Instantly(endpoint);
        assert.equal(es.listen(), undefined);

        done();
    });

    it('should return undefined if there is no event defined', function(done) {
        startServer();

        es = new Instantly(endpoint, {
            injectEventSourceNode: EventSource
        });

        assert.equal(es.listen(), undefined);

        done();
    });
});

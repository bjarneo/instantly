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

    function startServer() {
        var channel = new SseChannel();
        setInterval(function broadcast() {
            channel.send('testing instantly');
        }, 1500);

        setInterval(function broadcast() {
            channel.send({
                event: 'custom-event',
                data: 'testing instantly'
            });
        }, 1000);

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
        server.close();

        es.close();

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
        startServer();

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
        startServer();

        assert.throws(function() {
            es = new Instantly();
        }, /You need to provide a channel we can listen to!/);

        done();
    });
});

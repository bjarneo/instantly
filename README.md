

<p align="center"><img src="http://i.imgur.com/pXixrM8.png" /></p>



instantly
======
[![Code Climate](https://codeclimate.com/github/bjarneo/instantly/badges/gpa.svg)](https://codeclimate.com/github/bjarneo/instantly)
[![Test Coverage](https://codeclimate.com/github/bjarneo/instantly/badges/coverage.svg)](https://codeclimate.com/github/bjarneo/instantly/coverage)
![Travis](https://travis-ci.org/bjarneo/instantly.svg?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/npm/instantly/badge.svg)](https://snyk.io/test/npm/instantly)

What is this?
------
[EventSource](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) abstraction layer. <br>

The EventSource API is easy as it is. Reason I created this was to hide all logic used when I implement EventSource. <br>

IMPORTANT. This is NOT EventSource Polyfill!

Installation
------
It's available on npm.
```
npm install --save instantly
```

How can I use this library?
------
It's an UMD module. If you don't know what UMD is: [https://github.com/umdjs/umd](https://github.com/umdjs/umd)

Usage
------
```js
// Example
var es = new Instantly('http://your-sse-endpoint.codes/channel', {
    origin: 'http://your-sse-endpoint.codes', // Optional. Just an extra level of precaution to verify your event origin matches your app's origin.
    retries: 2, // Optional. Default: 5 retries if connection to your endpoint fails.
    timeout: 1000, // Optional. Default: 15 seconds (15000). This is how often we should retry.
    closeConnNotFocus: true, // Optional. Default: false. This will close the SSE connection if the tab/window is not in focus. Will reconnect when in focus.
    error: function(err) { console.log(err); }, // Optional. Extending the internal error handler.
    open: function(event) { console.log(event); }, // Optional. Extend when you open a connection to SSE.
    close: function() { console.log('closed'); }, // Optional. Extend when a connection to SSE is closed. (Usually when an error occur)
    injectEventSourceNode: require('eventsource') // Optional. If the module is being used in Node you're able to inject [eventsource-node](https://www.npmjs.com/package/eventsource)
});

// If you want to use default options
// var es = new Instantly('http://your-sse-endpoint.codes/channel');

// Listen to messages without any event set
es.on('message', function newMessage(msg) {
    console.log(msg.data);
});

// Listen to messages with an event set
es.on('eventName', function newMessage(msg) {
    console.log(msg.data);
});

// Start to listen for events send by SSE
es.listen();
```

If you need to close the connection client side
```js
// Close
es.close();

// Need to start the connection again?
es.listen();
```

Built in features
------
* If you send an event with event id 'CLOSE', it'll close your sse connection with no retries.

Example
------
Navigate to example folder
```
npm install
npm start
```
Open your browser in http://localhost:1337

High performance SSE server
------
[SSEHub (Server-Sent Events streaming server)](https://github.com/vgno/ssehub)

Contribution
------
Contributions are appreciated.

License
------
MIT-licensed. See LICENSE.

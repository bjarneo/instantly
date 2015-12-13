'use strict';

var fs = require('fs');
var express = require('express');
var eventsource = require('express-eventsource');
var instantly = fs.readFileSync('../instantly.min.js'); // Yes. Sync.
var app = express();
var router = express.Router();
var sse = eventsource({
    connections: 2
});
var broadcast = sse.sender('custom-event-name');

app.set('view engine', 'ejs');
app.set('views', __dirname);

// Enable CORS
app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

router.use(sse.middleware());

setInterval(function() {
    broadcast({ time: new Date() });
}, 100);

app.use('/sse', router);

app.get('/', function(req, res) {
    res.render('index', {
        instantly: instantly
    });
});

app.listen(1337, function() {
    console.log('Running on http://localhost:1337');
});

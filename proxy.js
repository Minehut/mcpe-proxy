var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;

var config = require('./config.json');

var client = dgram.createSocket("udp4");
var proxy = new EventEmitter();

function proxyStart() {
    client.bind(config.proxyPort);

    client.on("message", function(msg, info) {
        packetReceive(msg, info);
    });
}

function packetReceive(msg, info) {
    console.log("tunneling packet!");
    client.send(msg, 0, msg.length, 30001, "localhost");
}

proxyStart();
console.log("proxy listening on port " + config.proxyPort);
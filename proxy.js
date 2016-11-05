var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;

var config = require('./config.json');

var client = dgram.createSocket("udp4");
var proxy = new EventEmitter();

var connections = {};

function proxyStart() {
    client.bind(config.proxyPort);

    client.on("message", function(msg, info) {
        packetReceive(msg, info);
    });
}

function packetReceive(msg, info) {

    if (!connections[info.port]) {
        console.log("new connection!");
        console.log(info.address + ":" + info.port);

        connections[info.port] = {
            port: info.port,
            ip: info.address,
            time: new Date().getTime(),
            socket: dgram.createSocket("udp4")
        };

        connections[info.port].socket.bind(info.port);
        connections[info.port].socket.on("message", function (msg2, info2) {
            console.log("client-bound packet.");
            client.send(msg2, 0, msg2.length, info2.port, info2.address);
        })
    }

    else {
        console.log("server-bound packet...");
        client.send(msg, 0, msg.length, 30001, "192.99.101.38");
    }

}

proxyStart();
console.log("proxy listening on port " + config.proxyPort);
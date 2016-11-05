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

var serverIp = "192.99.101.38";
var serverPort = 30001;

function packetReceive(msg, info) {

    if(info.address != serverIp) {
        if (!connections[info.port]) {
            console.log("new player connection (" + info.address + ":" + info.port + ")");

            connections[info.port] = {
                port: info.port,
                ip: info.address,
                time: new Date().getTime(),
                socket: dgram.createSocket("udp4")
            };

            connections[info.port].socket.bind(info.port);
            connections[info.port].socket.on("message", function (msg2, info2) {
                console.log("tunneling server packet to client.");
                client.send(msg2, 0, msg2.length, info.port, info.address);
            });
        }

        connections[info.port].socket.send(msg, 0, msg.length, serverPort, serverIp);
    }

    //if(info.address != serverIp) {
    //    console.log('tunneling client packet to server');
    //    connections[info.port].socket.send(msg, 0, msg.length, serverPort, serverIp);
    //}

}

proxyStart();
console.log("proxy listening on port " + config.proxyPort);
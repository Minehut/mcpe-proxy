var dgram = require('dgram');
var EventEmitter = require('events').EventEmitter;
var inspect = require('object-inspect');

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
                console.log("tunneling player packet to server (" + getPacketId(msg2) + ")");
                client.send(msg2, 0, msg2.length, info.port, info.address); //send back to player
            });
        }

        console.log("tunneling server packet to player (" + getPacketId(msg) + ")");
        connections[info.port].socket.send(msg, 0, msg.length, serverPort, serverIp); //send to server
    } else {
        console.log("Port matched the server ip.");
    }
}

function getPacketId(msg) {
    if(typeof(msg) === 'undefined'){
        return "null";
    }

    console.log(inspect(msg));


    var hex = msg.toString('hex');
    console.log('hex: ' + hex);
    var type = new Buffer(hex.substr(0, 1)).readUInt8(0);
    console.log('type: ' + type);

    console.log('test: ' + 0x01);

    switch(type) {
        case 0x01:
            console.log('packet is 0x01!');
            break;
    }


    return ("0x" + msg.toString('hex')).substring(0, 4);
}

proxyStart();
console.log("proxy listening on port " + config.proxyPort);
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
                console.log("tunneling player packet to server (" + decodePacket(msg2) + ")");
                client.send(msg2, 0, msg2.length, info.port, info.address); //send back to player
            });
        }

        console.log("tunneling server packet to player (" + decodePacket(msg) + ")");
        connections[info.port].socket.send(msg, 0, msg.length, serverPort, serverIp); //send to server
    } else {
        console.log("Port matched the server ip.");
    }
}

function decodePacket(msg) {
    if(typeof(msg) === 'undefined'){
        return "null";
    }

    var hex = msg.toString('hex');
    var type = parseInt(hex.substr(0, 2), 16);

    var data = {};
    data['Packet ID'] = "0x" + hex.substr(0, 2);

    switch(type) {
        case 0x01:
            console.log('packet is 0x01!');
            break;

        case 0x1c:
            data['Ping ID'] = hex.substr(1, 8).toString('hex');
            data['Server ID'] = hex.substr(9, 8).toString('hex');
            break;

        case 0x07:
            console.log(inspect(msg));
            data['Magic'] = hex.substr(1, 16).toString('hex')
            data['Security + Cookie'] = hex.substr(17, 5).toString('hex')
            data['Server Port'] = parseInt(hex.substr(22, 2), 16);
            data['MTU Size'] = parseInt(hex.substr(24, 2), 16);
            data['Client ID'] = hex.substr(26, 8).toString('hex')
            break;
    }

    console.log(inspect(data));


    return ("0x" + msg.toString('hex').substring(0, 2));
}

proxyStart();
console.log("proxy listening on port " + config.proxyPort);
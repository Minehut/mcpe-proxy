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
    console.log('hex: ' + hex);
    var type = parseInt(hex.substr(0, 2), 16);

    var data = {};
    data['Packet ID'] = "0x" + type;

    switch(type) {
        case 0x01:
            console.log('packet is 0x01!');
            break;

        case 0x1c:
            data['Ping ID'] = hex.substr(1, 8).toString('hex');
            data['Server ID'] = hex.substr(9, 8).toString('hex');
            data['Magic'] = hex.substr(17, 16).toString('hex');
            data['Length'] = hex.substr(33, 2).readUInt16BE(0);
            data['Identifier'] = hex.substr(35, 11).toString('ascii');
            data['Server Name'] = hex.substr(46).toString('ascii');
            break;
    }

    console.log(inspect(data));


    return ("0x" + msg.toString('hex').substring(0, 2));
}

proxyStart();
console.log("proxy listening on port " + config.proxyPort);
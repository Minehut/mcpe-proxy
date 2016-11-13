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
                console.log("tunneling server packet to player.");
                console.log(msg2);
                console.log('-------------');
                client.send(msg2, 0, msg2.length, info.port, info.address); //send back to player
            });
        }

        console.log("tunneling player packet to server.");
        decodePacket(new Buffer(msg, 'hex'));
        console.log('-------------');
        connections[info.port].socket.send(msg, 0, msg.length, serverPort, serverIp); //send to server
    } else {
        console.log("Port patched the server ip!!");
    }
}

function decodePacket(msg) {
    var data = {};
    if(typeof(msg) === 'undefined'){
        data['Error'] = "No data found for this packet. Maybe the database was cleared?";
             return data;
    }

    var type = new Buffer(msg).readUInt8(0);
    var hex = msg;
    data['Data length'] =  msg.length;
    data['Packet ID'] = "0x" + msg.substr(0,1).toString('hex');

    console.log('packet type: ' + type);
}

proxyStart();
console.log("proxy listening on port " + config.proxyPort);
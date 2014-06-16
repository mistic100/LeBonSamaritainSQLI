var _ = require('underscore'),
    log = require('./log.js')('SocketClient');


var SocketClient = function(reader) {
    this.reader = null;
    this.sockets = null;
};

SocketClient.prototype.listen = function(reader, sockets) {
    var that = this;
    
    this.reader = reader;
    this.sockets = sockets;
    
    this.sockets.on('connection', this.connect.bind(this));
    
    this.reader.on('countersUpdated', function() {
        that.sockets.emit('countersUpdated', that.reader.getCounters());
    });
};

SocketClient.prototype.connect = function(socket) {
    var that = this;
    
    log.info('Client connected: '+ socket.id);
    
    socket.emit('countersUpdated', this.reader.getCounters());

    socket.on('disconnect', this.disconnect.bind(this));
};


SocketClient.prototype.disconnect = function() {
    var that = this;
    
    log.info('Client disconnected');
};


module.exports = SocketClient;
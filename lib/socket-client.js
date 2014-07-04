var log = require('./log')('SocketClient');


var SocketClient = function() {
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
    
    this.reader.on('newTweet', function(tweet) {
        that.sockets.emit('newTweets', [tweet]);
    });
};

SocketClient.prototype.connect = function(socket) {
    log.info('Client connected: '+ socket.id);
    
    socket.emit('countersUpdated', this.reader.getCounters());
    
    this.reader.getAllTweets(function(tweets) {
        socket.emit('newTweets', tweets);
    });

    socket.on('disconnect', this.disconnect.bind(this));
};


SocketClient.prototype.disconnect = function() {
    log.info('Client disconnected');
};


module.exports = SocketClient;
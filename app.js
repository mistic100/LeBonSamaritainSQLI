var express = require('express'),
    socketio = require('socket.io'),
    
    TwitterReader = require('./lib/twitter-reader'),
    SocketClient = require('./lib/socket-client'),

    config = require('./config'),
    mode = process.argv[2] || 'production',
    
    app = express(),
    server = app.listen(config.httpPort),
    io = socketio.listen(server),
    
    reader = new TwitterReader(),
    socket = new SocketClient();


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index', {
        mode: req.query.mode || mode
    });
});

app.get('*', function(req, res) {
    res.status(404).send('Not found');
});

reader.init();
socket.listen(reader, io.sockets);

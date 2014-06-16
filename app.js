var http = require('http'),
    express = require('express'),
    socketio = require('socket.io'),
    
    TwitterReader = require('./lib/twitter-reader.js'),
    SocketClient = require('./lib/socket-client.js'),

    port = Number(process.env.PORT || 8080),
    
    app = express(),
    server = app.listen(port),
    io = socketio.listen(server),
    reader = new TwitterReader(),
    socket = new SocketClient();


app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res) {
    res.render('index');
});

app.get('*', function(req, res) {
    res.status(404).send('Not found');
});

reader.init();
socket.listen(reader, io.sockets);

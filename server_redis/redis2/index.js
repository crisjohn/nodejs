var http = require('http');
var redis = require('redis');

var redisIP = "127.0.0.1",
    redisPort = "6379",
    redisChannel = 'onepiece',
    pub = redis.createClient(redisPort, redisIP),
    sub = redis.createClient(redisPort, redisIP);

sub.subscribe(redisChannel);

//create a server object:
http.createServer(function (req, res) {
    res.write('Hello World!'); //write a response to the client
    res.end(); //end the response
}).listen(8082); //the server object listens on port 8080

sub.on('message', function (channel, pubObj) {
    console.log('s1', { channel: channel, pubObj: pubObj });
})
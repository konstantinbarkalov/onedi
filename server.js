'use strict';
const express = require('express');
const app = express();
const babelify = require('express-babelify-middleware');

let server = require('http').Server(app);
let sio = require('socket.io')(server);
let logic = require('./logic.js')(sio);
server.listen(3000, () => console.log('Example app listening on port 3000!'))


app.use('/app.js', babelify('public/js/app.js'))

app.use(express.static('public/static'));

sio.on('connection', function (socket) {
  //socket.emit('news', { hello: 'world' });
  //socket.on('my other event', function (data) {
  //  console.log(data);
  //});
});
      
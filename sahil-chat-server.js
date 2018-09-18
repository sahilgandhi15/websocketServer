"use-strict";

process.title = 'sahil-chat-server';

var webSocketServerPort = 1316;
var webSocketServer = require('websocket').server;
var http = require('http');

var history = [];
var clients = [];
/**
 * Helper function for escaping input strings
 */
function htmlEntities(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
var nameColors = ['red', 'green', 'blue', 'magenta', 'purple', 'plum', 'orange'];
nameColors.sort(function (a, b) {
  return Math.random() > 0.5;
});

var server = http.createServer((req, res) => {})
server.listen(webSocketServerPort, () => {
  console.log('server is listening at port: ' + webSocketServerPort);
})

var socketServer = new webSocketServer({
  httpServer: server
})

socketServer.on('request', (request) => {
  console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
  var connection = request.accept(null, request.origin);
  var index = clients.push(connection) - 1;
  var userName = false;
  var userColor = false;

  console.log((new Date()) + ' Connection accepted.');

  if (history.length > 0) {
    connection.sendUTF(JSON.stringify({
      type: 'history',
      data: history
    }));
  }

  connection.on('message', function (message) {
    if (message.type === 'utf8') { // accept only text
      if (userName === false) { // first message sent by user is their name
        userName = htmlEntities(message.utf8Data);

        userColor = nameColors.shift();
        connection.sendUTF(JSON.stringify({
          type: 'color',
          data: userColor
        }));
        console.log((new Date()) + ' User is known as: ' + userName +
          ' with ' + userColor + ' color.');

      } else { // log and broadcast the message
        console.log((new Date()) + ' Received Message from ' +
          userName + ': ' + message.utf8Data);

        var obj = {
          time: (new Date()).getTime(),
          text: htmlEntities(message.utf8Data),
          author: userName,
          color: userColor
        };
        history.push(obj);
        history = history.slice(-100);
        history.reverse();
        var json = JSON.stringify({
          type: 'message',
          data: obj
        });
        for (var i = 0; i < clients.length; i++) {
          clients[i].sendUTF(json);
        }
      }
    }
  })

  connection.on('close', function (connection) {
    if (userName !== false && userColor !== false) {
      console.log((new Date()) + " Peer " +
        connection.remoteAddress + " disconnected.");
      // remove user from the list of connected clients
      clients.splice(index, 1);
      // push back user's color to be reused by another user
      nameColors.push(userColor);
    }
  });
})
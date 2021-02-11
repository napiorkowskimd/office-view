"use strict";

const https = require("https");
const fs = require("fs");
const WebSocketServer = require("websocket").server;

const options = {
  key: fs.readFileSync(process.env.SSL_KEY || "key.pem"),
  cert: fs.readFileSync(process.env.SSL_CERT || "cert.pem")
};

var roomIDMap = new Map();

function originIsAllowed(origin) {
  if (origin.startsWith(`https://localhost`)) return true;
  if (origin.startsWith("https://napiorkowskim.xyz")) return true;

  return false;
}

function typeToPipeEnd(type) {
  if (type == "receiver") return 0;
  return 1;
}
var httpsServer = https.createServer(options, function(req, res) {
  res.writeHead(200);
  res.end("hello world\n");
});

var wsServer = new WebSocketServer({
  httpServer: httpsServer,
  autoAcceptConnections: false
});

wsServer.on("request", function(request) {
  if (!originIsAllowed(request.origin)) {
    request.reject();
    console.log("Request with bad origin: " + request.origin);
    return;
  }

  var connection = request.accept("signalling-protocol", request.origin);

  var type = null;
  var otherType = null;
  var roomID = null;
  var pipeEnd = null;
  var otherPipeEnd = null;

  connection.on("message", function(message) {
    console.log(message);
    if (message.type !== "utf8") {
      console.log("Unsupported message type: " + message.type);
      return;
    }
    var data;
    try {
      data = JSON.parse(message.utf8Data);
    } catch (e) {
      console.error(`Parsing message failed with error ${e.message}`);
      return;
    }
    console.log(data);
    switch (data.message) {
      case "receiver-hello":
        type = "receiver";
        otherType = "sender";
      // fall through
      case "sender-hello": {
        if (type === null) type = "sender";
        if (otherType === null) otherType = "receiver";
        roomID = data.roomID;
        pipeEnd = typeToPipeEnd(type);
        otherPipeEnd = typeToPipeEnd(otherType);
        let room = roomIDMap.get(roomID);
        if (room === undefined) {
          room = [null, null];
        }
        room[pipeEnd] = connection;
        roomIDMap.set(roomID, room);
        if (room[otherPipeEnd] !== null) {
          room[typeToPipeEnd("sender")].sendUTF(
            JSON.stringify({
              message: "ready"
            })
          );
        }
        break;
      }
      case "pass": {
        if (roomID === null) return;
        let room = roomIDMap.get(roomID);
        let payload = data.payload;
        if (payload === undefined) break;
        room[otherPipeEnd]?.sendUTF(JSON.stringify(payload));
        break;
      }
    }
  });

  connection.on("close", function() {
    console.log("connection closed");
    if (roomID === null) return;
    let room = roomIDMap.get(roomID);
    roomID = null;
    if (!room) return;
    room[pipeEnd] = null;
    if (room[0] === null && room[1] === null) {
      roomIDMap.delete(roomID);
    } else {
      roomIDMap.set(roomID, room);
    }
  });
});

var port = 8081;
if (process.env.NODE_ENV === "production") {
  port = 8443;
}
httpsServer.listen(port);

import { singleShotWaitForEvent } from "./utils.js";

export default class Signalling {
  constructor(roomID, type) {
    this.type = type;
    this.roomID = roomID;
    this.socket = undefined;
    this.cbMap = new Map();
  }

  on(name, cb) {
    this.cbMap.set(name, cb);
  }

  close() {
    if (this.socket) {
      this.socket.close();
      this.socket = undefined;
    }
  }

  async init() {
    if (process.env.NODE_ENV == "production") {
      this.socket = new WebSocket(
        "wss://napiorkowskim.xyz:8443/signalling",
        "signalling-protocol"
      );
    } else {
      this.socket = new WebSocket(
        "wss://localhost:8081/signalling",
        "signalling-protocol"
      );
    }
    this.socket.addEventListener("error", this._onClosed.bind(this));
    this.socket.addEventListener("close", this._onClosed.bind(this));
    this.socket.onmessage = this._onSocketMessage.bind(this);
    console.log("Initializing websocket connection");
    await singleShotWaitForEvent(this.socket, "open");
    console.log("connected!");
    this.socket.send(
      JSON.stringify({
        message: this.type === "receiver" ? "receiver-hello" : "sender-hello",
        roomID: this.roomID
      })
    );
  }

  packMessage(msg) {
    return JSON.stringify({
      roomID: this.roomID,
      message: "pass",
      payload: msg
    });
  }

  send(msg) {
    this.socket.send(this.packMessage(msg));
  }

  sendLocalSdp(type, sdp) {
    this.send({
      message: "sdp",
      type: type,
      sdp: sdp
    });
  }

  sendIce(candidate) {
    this.send({
      message: "ice",
      candidate: candidate
    });
  }

  sendParams({ maxBitrate, crisp }) {
    this.send({
      message: "params",
      maxBitrate: maxBitrate,
      crisp: crisp
    });
  }

  _onSocketMessage(event) {
    let data = JSON.parse(event.data);
    let cb = this.cbMap.get(data.message);
    if (cb) cb(data);
  }

  _onClosed() {
    let cb = this.cbMap.get("closed");
    if (cb) cb();
  }
}

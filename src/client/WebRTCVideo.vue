<template>
  <div class="videoContainer">
    <video autoplay controls></video>
  </div>
</template>

<script>
import Signalling from "@/common/signalling.js";
import { StatEstimator } from "@/common/utils.js";

function createPeerConnection(sig) {
  var pc = new RTCPeerConnection();
  pc.onicecandidate = event => {
    if (event.candidate) {
      sig.sendIce(event.candidate);
    }
  };

  sig.on("sdp", async ({ type, sdp }) => {
    console.log("remote sdp");
    console.log(sdp);
    await pc.setRemoteDescription({
      type: type,
      sdp: sdp
    });
    if (type === "offer") {
      var answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sig.sendLocalSdp("answer", answer.sdp);
      console.log("local sdp");
      console.log(answer.sdp);
    }
  });

  sig.on("ice", ({ candidate }) => {
    console.log("ice:");
    console.log(candidate);
    pc.addIceCandidate(candidate);
  });
  return pc;
}

function mountPeerConnection(pc, component) {
  pc.ontrack = event => {
    component.$el.querySelector("video").srcObject = new MediaStream([
      event.track
    ]);
    setInterval(component.updateStats.bind(component), 1000);
    component.sig.sendParams({
      maxBitrate: component.maxBitrate !== undefined ? component.maxBitrate : 0,
      crisp: component.crisp !== undefined ? component.crisp : false
    });
  };
  pc.oniceconnectionstatechange = () => {
    switch (pc.iceConnectionState) {
      case "new":
      case "checking":
        component.$emit("update:peer-status", "connecting");
        break;
      case "connected":
      case "completed":
        component.$emit("update:peer-status", "connected");
        break;
      case "disconnected":
        component.$emit("update:peer-status", "disconnected");
        break;
      case "failed":
        component.$emit("update:peer-status", "failed");
        break;
    }
  };
}

export default {
  name: "WebRTCVideo",
  props: {
    roomID: String,
    active: Boolean,
    maxBitrate: Number,
    crisp: Boolean
  },
  emits: [
    "update:framerate",
    "update:bitrate",
    "update:signalling-status",
    "update:peer-status",
    "update:resolution"
  ],
  data() {
    return {};
  },
  setup(props) {
    var sig = new Signalling(props.roomID, "receiver");
    var pc = createPeerConnection(sig);
    var framerateEstimator = new StatEstimator(10000);
    var bitrateEstimator = new StatEstimator(10000);

    return {
      pc,
      sig,
      framerateEstimator,
      bitrateEstimator,
      videoElement: undefined
    };
  },
  mounted() {
    this.videoElement = this.$el.querySelector("video");
    this.$emit("update:signalling-status", "ready");
    mountPeerConnection(this.pc, this);
  },
  watch: {
    active(val) {
      if (val) {
        this.connect();
      } else {
        this.disconnect();
      }
    },
    maxBitrate(bitrate) {
      this.bitrateEstimator.reset();
      this.sig.sendParams({ maxBitrate: bitrate });
    },
    crisp(val) {
      this.framerateEstimator.reset();
      this.sig.sendParams({ crisp: val });
    }
  },
  methods: {
    async connect() {
      this.$emit("update:signalling-status", "connecting");
      this.sig.on("closed", () => {
        this.$emit("update:signalling-status", "disconnected");
      });
      await this.sig.init();
      this.$emit("update:signalling-status", "connected");

      this.bitrateEstimator.reset();
      this.framerateEstimator.reset();
    },
    disconnect() {
      this.sig.close();
      this.pc.close();
      this.bitrateEstimator.reset();
      this.framerateEstimator.reset();
      this.pc = createPeerConnection(this.sig);
      mountPeerConnection(this.pc, this);
      this.$emit("update:peer-status", "none");
    },
    async updateStats() {
      var receiver = this.pc.getTransceivers()[0].receiver;
      var stats = await receiver.getStats();
      var inboundVideoStat;
      for (let s of stats.values()) {
        if (s.type === "inbound-rtp") {
          inboundVideoStat = s;
          break;
        }
      }
      if (inboundVideoStat === undefined) return;
      var timestamp = inboundVideoStat.timestamp;
      var bitrate = this.bitrateEstimator.add(
        inboundVideoStat.bytesReceived,
        timestamp
      );
      if (bitrate != undefined) {
        bitrate *= 8;
        this.$emit("update:bitrate", bitrate);
      }
      var framerate = this.framerateEstimator.add(
        inboundVideoStat.framesDecoded,
        timestamp
      );
      if (framerate != undefined) {
        this.$emit("update:framerate", framerate);
      }
      var resolution =
        this.videoElement.videoWidth + "x" + this.videoElement.videoHeight;
      this.$emit("update:resolution", resolution);
    }
  }
};
</script>

<style>
.videoContainer {
  background-color: #555;
  height: 100%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
}

.videoContainer video {
  display: block;
  margin: 0 auto;
  height: 100%;
}
</style>

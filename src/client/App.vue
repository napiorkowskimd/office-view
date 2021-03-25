<template>
  <div class="root">
    <OptionsBar
      ref="options"
      :roomID="roomID"
      :resolution="resolution"
      :framerate="framerate"
      :bitrate="bitrate"
      :sigStatus="sigStatus"
      :peerStatus="peerStatus"
      :running="webrtcActive"
      :recording="recordingActive"
      @connectToggle="webrtcActive = !webrtcActive"
      @recordToggle="recordingActive = !recordingActive"
      @submit:lowBitrate="lowBitrate = $event"
      @submit:crisp="crisp = $event"
    ></OptionsBar>
    <WebRTCVideo
      ref="player"
      :roomID="roomID"
      :active="webrtcActive"
      :record="recordingActive"
      :maxBitrate="lowBitrate ? 50 : 0"
      :crisp="crisp"
      @update:resolution="resolution = $event"
      @update:framerate="framerate = $event"
      @update:bitrate="bitrate = $event"
      @update:signalling-status="sigStatus = $event"
      @update:peer-status="peerStatus = $event"
      @recordingEnded="onRecordingEnded($event)"
    ></WebRTCVideo>
  </div>
</template>

<script>
import WebRTCVideo from "./WebRTCVideo.vue";
import OptionsBar from "./OptionsBar.vue";

import { ref } from "vue";

export default {
  components: {
    OptionsBar,
    WebRTCVideo
  },
  setup() {
    var roomID = ref("");
    var url = new URL(window.location.href);
    roomID.value = url.searchParams.get("roomId");
    return {
      roomID
    };
  },
  data() {
    return {
      sigStatus: "none",
      peerStatus: "none",
      resolution: "0x0",
      bitrate: undefined,
      framerate: undefined,
      crisp: false,
      lowBitrate: false,
      webrtcActive: false,
      recordingActive: false,
      isChangingState: false
    };
  },
  methods: {
    onRecordingEnded(data) {
      this.recordingActive = false;
      if (data === undefined || data.size === 0) return;
      const url = window.URL.createObjectURL(data);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "recordedStream.webm";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }, 100);
    }
  }
};
</script>

<style>
html,
body {
  height: 99%;
}

body > div {
  height: 100%;
}
</style>

<style scoped>
.root {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
</style>

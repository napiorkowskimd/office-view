<template>
  <div class="optionsBar">
    <button id="connect-btn" @click="$emit('connectToggle')">
      <span>{{ running ? "Disconnect" : "Connect" }}</span>
    </button>
    <button id="record-btn" @click="$emit('recordToggle')" v-if="running">
      <span>{{ recording ? "Stop/Save" : "Record" }}</span>
    </button>
    <span>Room ID: {{ roomID }} </span>
    <span>Sig: {{ sigStatus }} </span>
    <span>Peer: {{ peerStatus }} </span>
    <span>Resolution: {{ resolution }}</span>
    <span>Framerate: {{ framerateText }}</span>
    <span>Bitrate: {{ bitrateText }}</span>
    <span class="option"
      ><label for="lowBitrateMode">Limit bitrate</label
      ><input
        type="checkbox"
        name="lowBitrateMode"
        @change="$emit('submit:lowBitrate', $event.target.checked)"
    /></span>
    <span class="option"
      ><label for="crispMode">Focus on image sharpness</label
      ><input
        type="checkbox"
        name="crispMode"
        @change="$emit('submit:crisp', $event.target.checked)"
    /></span>
  </div>
</template>

<script>
var formatNumber = num =>
  num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false
  });

export default {
  name: "OptionsBar",
  props: {
    running: {
      type: Boolean,
      default: false
    },
    recording: {
      type: Boolean,
      default: false
    },
    roomID: String,
    sigStatus: String,
    peerStatus: String,
    resolution: String,
    framerate: Number,
    bitrate: Number
  },
  computed: {
    framerateText() {
      if (this.framerate === undefined) return 0;
      return formatNumber(this.framerate);
    },
    bitrateText() {
      if (this.bitrate === undefined) return 0;
      const oneKb = 1024;
      const oneMb = 1024 * oneKb;
      let unit = "bps";
      var bitrate = this.bitrate;
      if (bitrate > oneMb) {
        bitrate /= oneMb;
        unit = "Mbps";
      } else if (bitrate > oneKb) {
        bitrate /= oneKb;
        unit = "Kbps";
      }
      return formatNumber(bitrate) + unit;
    }
  },
  methods: {
    connectToggle() {
      this.$emit("connectToggle");
    }
  },
  emits: ["submit:lowBitrate", "submit:crisp", "connectToggle", "recordToggle"]
};
</script>

<style scoped>
.optionsBar {
  border-bottom: 5px solid #444;
  display: flex;
  align-items: baseline;
}

.optionsBar > * {
  margin: 10px;
}

.optionsBar > button {
  position: relative;

  margin: 3px 10px;
  padding: 0;

  overflow: hidden;

  border-width: 0;
  outline: none;
  border-radius: 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);

  background-color: #2ecc71;
  color: #ecf0f1;

  transition: background-color 0.3s;
}

.optionsBar > button:hover,
.optionsBar > button:focus {
  background-color: #27ae60;
}

.optionsBar > button:disabled {
  background-color: #174e30;
}

.optionsBar > button > * {
  position: relative;
}

.optionsBar > button span {
  display: block;
  padding: 12px 24px;
}

.optionsBar > button :before {
  content: "";

  position: absolute;
  top: 50%;
  left: 50%;

  display: block;
  width: 0;
  padding-top: 0;

  border-radius: 100%;

  background-color: rgba(236, 240, 241, 0.3);

  -webkit-transform: translate(-50%, -50%);
  -moz-transform: translate(-50%, -50%);
  -ms-transform: translate(-50%, -50%);
  -o-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
}

.optionsBar > button :active:before {
  width: 120%;
  padding-top: 120%;

  transition: width 0.2s ease-out, padding-top 0.2s ease-out;
}
</style>

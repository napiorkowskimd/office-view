import Signalling from "@/common/signalling.js";

function setVideoTrackContentHints(stream, hint) {
  const tracks = stream.getVideoTracks();
  tracks.forEach(track => {
    if ("contentHint" in track) {
      track.contentHint = hint;
      if (track.contentHint !== hint) {
        console.log("Invalid video track contentHint: '" + hint + "'");
      }
    } else {
      console.log("MediaStreamTrack contentHint attribute not supported");
    }
  });
}

function getSupportedCodecs() {
  const { codecs } = RTCRtpSender.getCapabilities("video");
  var result = [];
  codecs.forEach(codec => {
    if (["video/red", "video/ulpfec", "video/rtx"].includes(codec.mimeType)) {
      return;
    }
    result.push(codec);
  });
  return result;
}

async function main() {
  var pc = new RTCPeerConnection();

  var url = new URL(window.location.href);
  var roomID = url.searchParams.get("roomId");
  var sig = new Signalling(roomID, "sender");
  pc.onicecandidate = event => {
    if (event.candidate) {
      sig.sendIce(event.candidate);
    }
  };

  sig.on("ready", async () => {
    console.log("Ready!");
    var offer = await pc.createOffer({
      offerToReceiveAudio: false,
      offerToReceiveVideo: false
    });
    await pc.setLocalDescription(offer);
    sig.sendLocalSdp("offer", offer.sdp);
  });

  sig.on("sdp", async ({ type, sdp }) => {
    await pc.setRemoteDescription({
      type: type,
      sdp: sdp
    });
    if (type === "offer") {
      var answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.sig.sendLocalSdp("answer", answer.sdp);
    }
  });

  sig.on("ice", ({ candidate }) => {
    pc.addIceCandidate(candidate);
  });

  sig.on("closed", () => {});

  var stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: 4096 },
      height: { ideal: 2160 }
    },
    audio: false
  });

  var crispStream = stream.clone();
  setVideoTrackContentHints(crispStream, "text");
  var currentStream = stream;

  const codecPreference = [
    {
      mimeType: "video/VP9",
      sdpFmtpLine: ["profile-id=2"]
    },
    {
      mimeType: "video/VP9" // Any other VP9
    },
    {
      mimeType: "video/VP8" // Any VP8
    },
    {
      mimeType: "video/H264",
      sdpFmtpLine: ["profile-level-id=640033"] // Hight profile
    },
    {
      mimeType: "video/H264",
      sdpFmtpLine: ["profile-level-id=4d0033"] // Main profile
    },
    {
      mimeType: "video/H264",
      sdpFmtpLine: ["profile-level-id=42e01f"] // Baseline profile
    },
    {
      mimeType: "video/H264" // Any other H264
    }
  ];

  var getCodecPriority = codec => {
    for (let i = 0; i < codecPreference.length; ++i) {
      // mimeType don't match, skip
      if (codec.mimeType != codecPreference[i].mimeType) continue;
      // No preference for sdpFmtpLine, return
      if (codecPreference[i].sdpFmtpLine === undefined) return i;
      // sdpFmtpLine is required, but this coded doesn't have it, skip
      if (codec.sdpFmtpLine === undefined) continue;
      let matches = true;
      let configs = new Set(codec.sdpFmtpLine.split(";"));
      codecPreference[i].sdpFmtpLine.forEach(option => {
        matches &= configs.has(option);
      });
      if (matches) return i;
    }
    return codecPreference.length;
  };
  var codecs = getSupportedCodecs();
  codecs.sort((a, b) => getCodecPriority(a) - getCodecPriority(b));
  var transceiver = pc.addTransceiver(stream.getVideoTracks()[0], {
    direction: "sendonly"
  });
  transceiver.setCodecPreferences(codecs);
  var sender = transceiver.sender;

  sig.on("params", ({ maxBitrate, crisp }) => {
    if (maxBitrate !== undefined) {
      let parameters = sender.getParameters();
      console.log(parameters.encodings);
      if (!parameters.encodings) {
        parameters.encodings = [{}];
      }
      if (maxBitrate === 0) {
        delete parameters.encodings[0].maxBitrate;
      } else {
        parameters.encodings[0].maxBitrate = maxBitrate * 1000;
      }
      sender.setParameters(parameters);
    }
    if (crisp !== undefined) {
      if (crisp) {
        if (currentStream !== crispStream) {
          sender.replaceTrack(crispStream.getVideoTracks()[0]);
          currentStream = crispStream;
        }
      } else {
        if (currentStream !== stream) {
          sender.replaceTrack(stream.getVideoTracks()[0]);
          currentStream = stream;
        }
      }
    }
  });
  await sig.init();
}

main();

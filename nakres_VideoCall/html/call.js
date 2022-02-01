let sender = false;
let serverId;
let callId;
let streaming = false;
let watching = false;
const RTCServers = {
  iceServers: [
    {
      urls: ["stun:stun1.l.google.com:19302", "stun:stun2.l.google.com:19302"],
    },
  ],
  iceCandidatePoolSize: 10,
};

async function handleSignallingData(data) {
  switch (data.type) {
    case "offer":
      // console.log(JSON.stringify(data.offer))
      let sessionDesc = new RTCSessionDescription(data.offer);
      await peerConn.setRemoteDescription(sessionDesc);
      // peerConn.setRemoteDescription(data.offer);
      createAndSendAnswer();
      break;
    case "candidate":
      // console.log(JSON.stringify(data.candidate))
      let candidate = new RTCIceCandidate(data.candidate);
      peerConn.addIceCandidate(candidate);
  }
}

async function createAndSendAnswer() {
  let candidateAnswer = await peerConn.createAnswer();
  await peerConn.setLocalDescription(candidateAnswer);

  let answerObject = {
    sdp: candidateAnswer.sdp,
    type: candidateAnswer.type
  }
  sendData({
    type: "send_answer",
    answer: answerObject,
  });

  // peerConn.createAnswer(
  //   (answer) => {
  //     peerConn.setLocalDescription(answer);
  //     sendData({
  //       type: "send_answer",
  //       answer: answer,
  //     });
  //   },
  //   (error) => {
  //     console.log(error);
  //   }
  // );
}

function sendData(data) {
  //todo global
  data.callId = parseInt(callId);
  data.serverId = parseInt(serverId);
  $.post("https://nakres_VideoCall/sendData", JSON.stringify(data));
}

let localStream;
let peerConn;

function joinCall() {
  $.post("https://nakres_VideoCall/addStartCall");
  watching = true;
  // callId = document.getElementById("callId-input").value
  console.log("Server id : ", serverId)
  callId = serverId;
  // document.getElementById("video-call-div").style.display = "inline";
  peerConn = new RTCPeerConnection(RTCServers);
  let canvas = document.getElementById("local-video");
  MainRender.renderToTarget(canvas);
  let stream = canvas.captureStream();

  localStream = stream;
  document.getElementById("local-video").srcObject = localStream;

  let video = document.getElementById("remote-video");
  video.srcObject = new MediaStream(); //? create a media stream for remote stream

  peerConn.onicecandidate = (e) => {
    if (e.candidate == null) return;
    // console.log(JSON.stringify(e.candidate))
    let candidate = new RTCIceCandidate(e.candidate);
    peerConn.addIceCandidate(candidate);
    sendData({
      type: "send_candidate",
      candidate: candidate,
    });
  };

  // peerConn.ontrack = function (event) {
  //   console.log(event.streams[0]);
  //   video.srcObject = event.streams[0];
  // };

  peerConn.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
      // console.log(video.videoWidth)
      video.srcObject.addTrack(track);
    });
  };

  // peerConn.addStream(localStream);
  localStream.getTracks().forEach(function (track) {
    peerConn.addTrack(track, localStream);
  });

  sendData({
    type: "join_call",
  });
}

// ************************************************************************************************ //

async function handleSignallingDataSender(data) {
  switch (data.type) {
    case "answer":
      // console.log(JSON.stringify(data.answer))
      let answer = new RTCSessionDescription(data.answer);
      await SenderpeerConn.setRemoteDescription(answer);
      // SenderpeerConn.setRemoteDescription(answer);
      break;
    case "candidate":
      // console.log(JSON.stringify(data));
      let candidate = new RTCIceCandidate(data.candidate);
      SenderpeerConn.addIceCandidate(candidate);
  }
}

function sendcallId() {
  callId = document.getElementById("callId-input").value;
  sendData({
    type: "store_user",
  });
}

let SenderpeerConn;
async function startCall() {
  streaming = true;
  $.post("https://nakres_VideoCall/addStartCall");
  await sendcallId();
  sender = true;
  // document.getElementById("video-call-div").style.display = "inline";
  //todo stream eklenecek

  let canvas = document.getElementById("local-video");
  MainRender.renderToTarget(canvas);
  let stream = canvas.captureStream();

  localStream = stream;
  document.getElementById("local-video").srcObject = localStream;

  SenderpeerConn = new RTCPeerConnection(RTCServers);
  // SenderpeerConn.addStream(localStream);
  localStream.getTracks().forEach(function (track) {
    SenderpeerConn.addTrack(track, localStream);
  });

  SenderpeerConn.ontrack = function (event) {
    document.getElementById("remote-video").srcObject = event.streams[0];
  };

  SenderpeerConn.onicecandidate = (e) => {
    if (e.candidate == null) return;
    // console.log((JSON.stringify(e.candidate)))
    console.log("sender")
    let Sendercandidate = new RTCIceCandidate(e.candidate);
    SenderpeerConn.addIceCandidate(Sendercandidate);
    // console.log(JSON.stringify(Sendercandidate))
    sendData({
      type: "store_candidate",
      candidate: Sendercandidate,
    });
  };
  createAndSendOffer();
  $.post("https://nakres_VideoCall/startCallId", JSON.stringify({ id: callId }));
}

async function createAndSendOffer() {
  let candidateOffer = await SenderpeerConn.createOffer();
  await SenderpeerConn.setLocalDescription(candidateOffer);
  let offerObject = {
    sdp: candidateOffer.sdp,
    type: candidateOffer.type,
  };

  sendData({
    type: "store_offer",
    offer: offerObject,
  });

  // SenderpeerConn.createOffer(
  //   (offer) => {
  //     sendData({
  //       type: "store_offer",
  //       offer: offer,
  //     });

  //     SenderpeerConn.setLocalDescription(offer);
  //   },
  //   (error) => {
  //     console.log(error);
  //   }
  // );
}


function stopCall() {
  if (streaming) {
    streaming = false;
    sender = false;
    serverId = null
    callId = null
    $.post(
      "https://nakres_VideoCall/stopVideoCall",
      JSON.stringify({ serverId: serverId , callId: callId})
    );
    SenderpeerConn.close();
    MainRender.stop();
    let video = document.getElementById("remote-video");
    video.pause();
    video.srcObject = null;
  } else if (watching) {
    watching = false;
    sender = false;
    serverId = null
    callId = null
    peerConn.close();
    MainRender.stop();
    let video = document.getElementById("remote-video");
    $.post(
      "https://nakres_VideoCall/leaveStream",
      JSON.stringify({ serverId: serverId })
    );
    video.pause();
    video.srcObject = null;
  }
}

window.addEventListener("message", function (e) {
  const message = e.data;
  message.type == "sendData"
    ? ListenerServerData(message.data)
    : message.type == "answer"
      ? ((document.getElementById("coming-call").style.display = "inline"),
        (serverId = message.serverId))
      : message.type == "open"
        ? ((document.getElementById("wrapper").style.top = "0px"),
          (serverId = message.serverId))
        : (document.getElementById("wrapper").style.top = "100%");
});

function ListenerServerData(data) {
  sender ? handleSignallingDataSender(data) : handleSignallingData(data);
}

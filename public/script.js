let Peer = window.Peer;
const socket = io("/");

const videoGrid = document.getElementById("video-grid");

const myVideo = document.createElement("video");
myVideo.muted = true;

const peers = {};

const peer = new Peer({
  host: "/",
  path: "/peerjs",
  debug: 2,
  port: 3030,
});

peer.on("call", async (call) => {
  let stream = null;

  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    call.answer(stream);

    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });
  } catch (err) {
    console.log("ERROR returning the stream: " + err);
  }
});

socket.on("user-connected", async (userId) => {
  connectDataToNewUser(userId);
  console.log("user-connected: " + userId);
  // Obtain myVideo stream again
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
  } catch (err) {
    console.log("Error getting stream: " + err);
  }
  connectMediaToNewUser(userId, stream);
});

(async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    if (stream != undefined) {
      addVideoStream(myVideo, stream);
    } else {
      console.log("error getting user media");
    }
  } catch (err) {
    console.log("ERROR returning the stream: " + err);
  }
})();

peer.on("open", (id) => {
  console.log(
    '"open" event received from userId: ' +
      id +
      ", occurs when connection to peer server is established"
  );
  socket.emit("join-room", ROOM_ID, id);
  console.log(
    '"join-room" emit for ROOM_ID: ' + ROOM_ID + ", and userId: " + id
  );
});
peer.on("error", (err) => {
  console.log("error: " + err + ' when setting the event handler "call"');
});

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) {
    peers[userId].close();
    console.log('"user-disconnected" event received from userId: ' + userId);
  }
});

peer.on("connection", (conn) => {
  console.log("Connection to remote userId: " + peer.id + " established");
  conn.on("data", (data) => {
    console.log(
      "Received data " +
        data +
        " from originator userId: " +
        conn.peer +
        " as destination"
    );
  });
  conn.on("open", () => {
    conn.send("Hello!");
    console.log(
      "Received open, sending Hello to origin from destination userId: " +
        conn.peer
    );
  });
});

const connectDataToNewUser = (userId) => {
  let conn = peer.connect(userId);
  conn.on("data", (data) => {
    console.log(
      "Received data: " +
        data +
        ", from remote userId: " +
        userId +
        "as originator, meaning I called and got a reply"
    );
  });
  conn.on("open", () => {
    conn.send("hi!");
  });
};

const connectMediaToNewUser = (userId, stream) => {
  const call = peer.call(userId, stream);
  console.log("peer.call calling userId: " + userId);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    console.log(
      '"stream" event received from userId: ' +
        userId +
        ", in response to my call, calling addVideoStream(UserVideoStream)"
    );
    addVideoStream(video, userVideoStream);
  });
  call.on("close", () => {
    video.remove();
  });
  call.on("error", (error) => {
    console.log("ERROR in call.on inside connectToNewUser", error);
  });
  peers[userId] = call;
};

const addVideoStream = (video, stream) => {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
    videoGrid.append(video);
  });
};

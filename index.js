const express = require("express");
const app = express();
//using the env
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });
const server = require("http").Server(app);

const socketS = require("socket.io");

const io = new socketS.Server(server, {
  allowEIO3: true,
});

io.engine.on("connection_error", (err) => {
  console.log(err.message); // the error message, for example "Session ID unknown"
  console.log(err.context); // some additional error context
});
const { ExpressPeerServer } = require("peer");

const peerServer = ExpressPeerServer(server, {
  debug: true,
});
const { v4: uuidV4 } = require("uuid");
const { PORT } = require("./utils");

app.use("/peerjs", peerServer);

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

app.get("/:room", (req, res) => {
  console.log("roomId: " + req.params.room);
  res.render("room", { roomId: req.params.room });
}); // Between brakets passes the variable roomId to room.ejs

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId) => {
    console.log(
      '*** "join-room" event received from client: ' +
        userId +
        " in roomId: " +
        roomId
    );
    socket.join(roomId);
    socket.broadcast.to(roomId).emit("user-connected", userId);
    console.log(
      '*** "user-connected" event broadcasted to roomId: ' +
        roomId +
        " for userId: " +
        userId +
        " from server"
    );
    socket.on("disconnect", () => {
      socket.broadcast.to(roomId).emit("user-disconnected", userId);
      console.log(
        '*** "disconnect" event broadcasted to roomId: ' +
          roomId +
          " for userId: " +
          userId +
          " from server"
      );
    });
  });
});

const port = PORT || 5000;
server.listen(port, () => {
  console.log(`connected on port ${port}`);
});

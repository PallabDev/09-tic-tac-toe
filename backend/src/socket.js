import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { User } from "./models/user.model.js";
import {
  assertRoomPlayer,
  getPopulatedRoom,
  makeRoomMove,
  restartRoomGame,
} from "./services/room.service.js";

const toSocketError = (error) => ({
  message: error?.message || "Something went wrong",
  statusCode: error?.statusCode || 500,
});

export const attachSocketServer = (httpServer, app) => {
  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  const io = new Server(httpServer, {
    cors: {
      origin: clientUrl,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized request"));

      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select("-password -hashedRefreshToken");
      if (!user) return next(new Error("Invalid access token"));

      socket.user = user;
      return next();
    } catch (_error) {
      return next(new Error("Invalid access token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("room:join", async ({ roomId }, callback) => {
      try {
        const room = await getPopulatedRoom(roomId);
        assertRoomPlayer(room, socket.user._id);
        socket.join(roomId);
        socket.to(roomId).emit("room:presence", {
          message: `${socket.user.email} connected`,
        });
        callback?.({ ok: true, room });
      } catch (error) {
        callback?.({ ok: false, error: toSocketError(error) });
      }
    });

    socket.on("room:move", async ({ roomId, cellIndex }, callback) => {
      try {
        const room = await makeRoomMove(roomId, socket.user._id, cellIndex);
        io.to(roomId).emit("room:state", room);
        callback?.({ ok: true, room });
      } catch (error) {
        callback?.({ ok: false, error: toSocketError(error) });
      }
    });

    socket.on("room:restart", async ({ roomId }, callback) => {
      try {
        const room = await restartRoomGame(roomId, socket.user._id);
        io.to(roomId).emit("room:state", room);
        callback?.({ ok: true, room });
      } catch (error) {
        callback?.({ ok: false, error: toSocketError(error) });
      }
    });

    socket.on("room:leave", ({ roomId }) => {
      socket.leave(roomId);
    });
  });

  app.set("io", io);
  return io;
};

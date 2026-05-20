import { Room } from "../models/room.model.js";
import {
  assertRoomPlayer,
  generateRoomId,
  getPopulatedRoom,
  joinRoomById,
  makeRoomMove,
  restartRoomGame,
} from "../services/room.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create({
    roomId: await generateRoomId(),
    players: [{ user: req.user._id, symbol: "X" }],
  });

  return res.status(201).json(new ApiResponse(201, { room }, "Room created"));
});

export const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await joinRoomById(roomId, req.user._id);
  req.app.get("io")?.to(roomId).emit("room:state", room);

  return res.status(200).json(new ApiResponse(200, { room }, "Joined room"));
});

export const getRoomState = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await getPopulatedRoom(roomId);
  assertRoomPlayer(room, req.user._id);

  return res.status(200).json(new ApiResponse(200, { room }, "Room state fetched"));
});

export const makeMove = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { cellIndex } = req.body;

  const room = await makeRoomMove(roomId, req.user._id, cellIndex);
  req.app.get("io")?.to(roomId).emit("room:state", room);
  return res.status(200).json(new ApiResponse(200, { room }, "Move updated"));
});

export const restartGame = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  const room = await restartRoomGame(roomId, req.user._id);
  req.app.get("io")?.to(roomId).emit("room:state", room);
  return res.status(200).json(new ApiResponse(200, { room }, "Game restarted"));
});

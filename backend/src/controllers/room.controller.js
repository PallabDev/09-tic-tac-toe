import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const WIN_PATTERNS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const getWinner = (board) => {
  for (const [a, b, c] of WIN_PATTERNS) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
  }
  return null;
};

const generateRoomId = async () => {
  let roomId = "";
  let exists = true;
  while (exists) {
    roomId = `${Math.floor(100000 + Math.random() * 900000)}`;
    // eslint-disable-next-line no-await-in-loop
    exists = !!(await Room.findOne({ roomId }));
  }
  return roomId;
};

export const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create({
    roomId: await generateRoomId(),
    players: [{ user: req.user._id, symbol: "X" }],
  });

  return res.status(201).json(new ApiResponse(201, { room }, "Room created"));
});

export const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findOne({ roomId }).populate("players.user", "email");

  if (!room) throw new ApiError(404, "Room not found");

  const alreadyPlayer = room.players.some((player) => String(player.user._id) === String(req.user._id));
  if (alreadyPlayer) {
    return res.status(200).json(new ApiResponse(200, { room }, "Already joined this room"));
  }

  if (room.players.length >= 2) throw new ApiError(409, "Room is full");

  room.players.push({ user: req.user._id, symbol: "O" });
  room.status = "playing";
  await room.save();
  await room.populate("players.user", "email");

  return res.status(200).json(new ApiResponse(200, { room }, "Joined room"));
});

export const getRoomState = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const room = await Room.findOne({ roomId }).populate("players.user", "email");
  if (!room) throw new ApiError(404, "Room not found");

  const isPlayer = room.players.some((player) => String(player.user._id) === String(req.user._id));
  if (!isPlayer) throw new ApiError(403, "You are not part of this room");

  return res.status(200).json(new ApiResponse(200, { room }, "Room state fetched"));
});

export const makeMove = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { cellIndex } = req.body;

  const room = await Room.findOne({ roomId }).populate("players.user", "email");
  if (!room) throw new ApiError(404, "Room not found");
  if (room.status !== "playing") throw new ApiError(400, "Game is not active");
  if (cellIndex < 0 || cellIndex > 8) throw new ApiError(400, "Invalid board cell");
  if (room.board[cellIndex]) throw new ApiError(409, "Cell already filled");

  const currentPlayer = room.players.find((player) => String(player.user._id) === String(req.user._id));
  if (!currentPlayer) throw new ApiError(403, "You are not part of this room");
  if (currentPlayer.symbol !== room.turn) throw new ApiError(409, "Not your turn");

  room.board[cellIndex] = currentPlayer.symbol;

  const winner = getWinner(room.board);
  if (winner) {
    room.status = "finished";
    room.winner = winner;
  } else if (room.board.every((cell) => cell)) {
    room.status = "finished";
    room.winner = "DRAW";
  } else {
    room.turn = room.turn === "X" ? "O" : "X";
  }

  await room.save();
  return res.status(200).json(new ApiResponse(200, { room }, "Move updated"));
});

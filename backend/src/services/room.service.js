import { Room } from "../models/room.model.js";
import { ApiError } from "../utils/ApiError.js";

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

export const generateRoomId = async () => {
  let roomId = "";
  let exists = true;
  while (exists) {
    roomId = `${Math.floor(100000 + Math.random() * 900000)}`;
    // eslint-disable-next-line no-await-in-loop
    exists = !!(await Room.findOne({ roomId }));
  }
  return roomId;
};

export const getPopulatedRoom = async (roomId) => {
  const room = await Room.findOne({ roomId }).populate("players.user", "email");
  if (!room) throw new ApiError(404, "Room not found");
  return room;
};

export const assertRoomPlayer = (room, userId) => {
  const isPlayer = room.players.some((player) => String(player.user._id) === String(userId));
  if (!isPlayer) throw new ApiError(403, "You are not part of this room");
};

export const joinRoomById = async (roomId, userId) => {
  const room = await getPopulatedRoom(roomId);

  const alreadyPlayer = room.players.some((player) => String(player.user._id) === String(userId));
  if (alreadyPlayer) return room;

  if (room.players.length >= 2) throw new ApiError(409, "Room is full");

  room.players.push({ user: userId, symbol: "O" });
  room.status = "playing";
  await room.save();
  await room.populate("players.user", "email");

  return room;
};

export const makeRoomMove = async (roomId, userId, cellIndex) => {
  const room = await getPopulatedRoom(roomId);
  if (room.status !== "playing") throw new ApiError(400, "Game is not active");
  if (!Number.isInteger(cellIndex) || cellIndex < 0 || cellIndex > 8) {
    throw new ApiError(400, "Invalid board cell");
  }
  if (room.board[cellIndex]) throw new ApiError(409, "Cell already filled");

  const currentPlayer = room.players.find((player) => String(player.user._id) === String(userId));
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
  await room.populate("players.user", "email");

  return room;
};

export const restartRoomGame = async (roomId, userId) => {
  const room = await getPopulatedRoom(roomId);
  assertRoomPlayer(room, userId);

  if (room.players.length < 2) throw new ApiError(400, "Need two players to replay");
  const requestingPlayer = room.players.find((player) => String(player.user._id) === String(userId));

  room.board = Array(9).fill("");
  room.turn = requestingPlayer.symbol;
  room.status = "playing";
  room.winner = null;

  await room.save();
  await room.populate("players.user", "email");

  return room;
};

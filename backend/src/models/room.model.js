import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      match: /^\d{6}$/,
    },
    players: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        symbol: {
          type: String,
          enum: ["X", "O"],
          required: true,
        },
      },
    ],
    board: {
      type: [String],
      default: () => Array(9).fill(""),
    },
    turn: {
      type: String,
      enum: ["X", "O"],
      default: "X",
    },
    status: {
      type: String,
      enum: ["waiting", "playing", "finished"],
      default: "waiting",
    },
    winner: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);

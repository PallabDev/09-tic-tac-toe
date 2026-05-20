import { Router } from "express";
import {
  createRoom,
  getRoomState,
  joinRoom,
  makeMove,
  restartGame,
} from "../controllers/room.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);
router.post("/", createRoom);
router.post("/:roomId/join", joinRoom);
router.get("/:roomId", getRoomState);
router.post("/:roomId/move", makeMove);
router.post("/:roomId/restart", restartGame);

export default router;

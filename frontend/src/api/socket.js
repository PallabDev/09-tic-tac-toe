import { io } from "socket.io-client";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

export const createGameSocket = (token) =>
  io(API_ORIGIN, {
    auth: { token },
    autoConnect: false,
    reconnectionAttempts: 5,
    reconnectionDelay: 500,
  });

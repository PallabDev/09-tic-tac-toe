import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ACCESS_TOKEN_KEY, http } from "../api/http";
import { createGameSocket } from "../api/socket";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

const ROOM_KEY = "ttt_room_id";
const parseErrorMessage = (error) =>
  error?.response?.data?.message || "Request failed. Please try again.";

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [socketStatus, setSocketStatus] = useState("connecting");
  const [isMoving, setIsMoving] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const socketRef = useRef(null);

  const fetchRoom = async () => {
    try {
      const response = await http.get(`/rooms/${roomId}`);
      setRoom(response.data.data.room);
      setErrorMessage("");
      localStorage.setItem(ROOM_KEY, roomId);
    } catch (error) {
      setErrorMessage(parseErrorMessage(error));
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchRoom);
  }, [roomId]);

  useEffect(() => {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!token) {
      return undefined;
    }

    const socket = createGameSocket(token);
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketStatus("online");
      socket.emit("room:join", { roomId }, (response) => {
        if (response?.ok) {
          setRoom(response.room);
          setErrorMessage("");
        } else {
          setErrorMessage(response?.error?.message || "Unable to join realtime room");
        }
      });
    });

    socket.on("disconnect", () => setSocketStatus("offline"));
    socket.on("connect_error", (error) => {
      setSocketStatus("offline");
      setErrorMessage(error.message || "Realtime connection failed");
    });
    socket.on("room:state", (nextRoom) => {
      setRoom(nextRoom);
      setErrorMessage("");
      setIsMoving(false);
      setIsRestarting(false);
    });

    socket.connect();

    return () => {
      socket.emit("room:leave", { roomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId]);

  const myPlayer = useMemo(
    () => room?.players?.find((player) => player.user._id === user?._id),
    [room, user]
  );

  const makeMove = async (cellIndex) => {
    setIsMoving(true);
    setErrorMessage("");
    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit("room:move", { roomId, cellIndex }, async (response) => {
        if (response?.ok) {
          setRoom(response.room);
          setIsMoving(false);
          return;
        }

        try {
          const restResponse = await http.post(`/rooms/${roomId}/move`, { cellIndex });
          setRoom(restResponse.data.data.room);
        } catch (error) {
          setErrorMessage(response?.error?.message || parseErrorMessage(error));
        } finally {
          setIsMoving(false);
        }
      });
      return;
    }

    try {
      const response = await http.post(`/rooms/${roomId}/move`, { cellIndex });
      setRoom(response.data.data.room);
    } catch (error) {
      setErrorMessage(parseErrorMessage(error));
    } finally {
      setIsMoving(false);
    }
  };

  const joinRoom = async () => {
    try {
      await http.post(`/rooms/${roomId}/join`);
      await fetchRoom();
    } catch (error) {
      setErrorMessage(parseErrorMessage(error));
    }
  };

  const restartGame = async () => {
    setIsRestarting(true);
    setErrorMessage("");
    const socket = socketRef.current;

    if (socket?.connected) {
      socket.emit("room:restart", { roomId }, async (response) => {
        if (response?.ok) {
          setRoom(response.room);
          setIsRestarting(false);
          return;
        }

        try {
          const restResponse = await http.post(`/rooms/${roomId}/restart`);
          setRoom(restResponse.data.data.room);
        } catch (error) {
          setErrorMessage(response?.error?.message || parseErrorMessage(error));
        } finally {
          setIsRestarting(false);
        }
      });
      return;
    }

    try {
      const response = await http.post(`/rooms/${roomId}/restart`);
      setRoom(response.data.data.room);
    } catch (error) {
      setErrorMessage(parseErrorMessage(error));
    } finally {
      setIsRestarting(false);
    }
  };

  const leaveToLobby = () => {
    localStorage.removeItem(ROOM_KEY);
    navigate("/");
  };

  return (
    <div className="page-center game-page">
      <Card
        title={`Room ${roomId}`}
        rightAction={
          <button className="btn-ghost" type="button" onClick={leaveToLobby}>
            Back
          </button>
        }
      >
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        {!room ? (
          <div className="stack">
            <p className="muted-text">Fetching room...</p>
            <button className="btn-secondary" type="button" onClick={joinRoom}>
              Join Room
            </button>
          </div>
        ) : (
          <>
            <div className="status-grid">
              <div className="status-pill">
                <span>Game</span>
                <strong>{room.status}</strong>
              </div>
              <div className="status-pill">
                <span>You</span>
                <strong>{myPlayer?.symbol || "Spectator"}</strong>
              </div>
              <div className="status-pill">
                <span>Realtime</span>
                <strong className={socketStatus === "online" ? "online-text" : ""}>{socketStatus}</strong>
              </div>
            </div>
            <div className="turn-banner">
              {room.status === "finished"
                ? room.winner === "DRAW"
                  ? "Draw game"
                  : `${room.winner} wins`
                : room.turn === myPlayer?.symbol
                  ? "Your move"
                  : `${room.turn}'s turn`}
            </div>
            <div className="board">
              {room.board.map((cell, index) => (
                <button
                  type="button"
                  key={index}
                  className={`board-cell ${cell ? `is-${cell.toLowerCase()}` : ""}`}
                  onClick={() => makeMove(index)}
                  disabled={!myPlayer || isMoving || room.status !== "playing" || room.turn !== myPlayer.symbol || !!cell}
                  aria-label={`Cell ${index + 1}`}
                >
                  {cell}
                </button>
              ))}
            </div>
            {room.players.length < 2 ? (
              <button className="btn-secondary" type="button" onClick={joinRoom}>
                Join as Player O
              </button>
            ) : null}
            {room.status === "finished" && myPlayer ? (
              <button
                className="btn-primary"
                type="button"
                onClick={restartGame}
                disabled={isRestarting}
              >
                {isRestarting ? "Restarting..." : "Replay"}
              </button>
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
};

export default RoomPage;

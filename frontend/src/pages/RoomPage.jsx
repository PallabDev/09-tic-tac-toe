import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { http } from "../api/http";
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
    fetchRoom();
    const interval = setInterval(fetchRoom, 2000);
    return () => clearInterval(interval);
  }, [roomId]);

  const myPlayer = useMemo(
    () => room?.players?.find((player) => player.user._id === user?._id),
    [room, user]
  );

  const makeMove = async (cellIndex) => {
    try {
      const response = await http.post(`/rooms/${roomId}/move`, { cellIndex });
      setRoom(response.data.data.room);
    } catch (error) {
      setErrorMessage(parseErrorMessage(error));
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

  const leaveToLobby = () => {
    localStorage.removeItem(ROOM_KEY);
    navigate("/");
  };

  return (
    <div className="page-center">
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
            <p className="muted-text">Status: {room.status}</p>
            <p className="muted-text">Your symbol: {myPlayer?.symbol || "Not joined"}</p>
            <p className="muted-text">
              {room.status === "finished"
                ? room.winner === "DRAW"
                  ? "Draw game"
                  : `Winner is ${room.winner}`
                : `Current turn: ${room.turn}`}
            </p>
            <div className="board">
              {room.board.map((cell, index) => (
                <button
                  type="button"
                  key={index}
                  className="board-cell"
                  onClick={() => makeMove(index)}
                  disabled={!myPlayer || room.status !== "playing" || room.turn !== myPlayer.symbol || !!cell}
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
          </>
        )}
      </Card>
    </div>
  );
};

export default RoomPage;

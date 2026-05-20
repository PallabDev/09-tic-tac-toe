import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { http } from "../api/http";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";

const ROOM_KEY = "ttt_room_id";
const parseErrorMessage = (error) =>
  error?.response?.data?.message || "Request failed. Please try again.";

const LobbyPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [joinCode, setJoinCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const createRoom = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await http.post("/rooms");
      const roomId = response.data.data.room.roomId;
      localStorage.setItem(ROOM_KEY, roomId);
      navigate(`/rooms/${roomId}`);
    } catch (error) {
      setErrorMessage(parseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const normalized = joinCode.trim();
      await http.post(`/rooms/${normalized}/join`);
      localStorage.setItem(ROOM_KEY, normalized);
      navigate(`/rooms/${normalized}`);
    } catch (error) {
      setErrorMessage(parseErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const continueRoom = () => {
    const stored = localStorage.getItem(ROOM_KEY);
    if (stored) navigate(`/rooms/${stored}`);
  };

  return (
    <div className="page-center">
      <Card
        title="Lobby"
        rightAction={
          <button type="button" className="btn-ghost" onClick={logout}>
            Logout
          </button>
        }
      >
        <p className="muted-text">Logged in as {user?.email}</p>
        <div className="stack">
          <button className="btn-primary" type="button" onClick={createRoom} disabled={loading}>
            Create Room
          </button>
          <input
            className="input"
            placeholder="Enter 6 digit room code"
            value={joinCode}
            onChange={(event) => setJoinCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          <button className="btn-secondary" type="button" onClick={joinRoom} disabled={loading || joinCode.length !== 6}>
            Join Room
          </button>
          <button className="btn-ghost" type="button" onClick={continueRoom}>
            Continue Previous Room
          </button>
          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
        </div>
      </Card>
    </div>
  );
};

export default LobbyPage;

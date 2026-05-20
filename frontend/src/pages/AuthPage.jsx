import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import Card from "../components/Card";
import { useAuth } from "../context/AuthContext";
import { getSafeErrorMessage } from "../utils/errorMessage";

const AuthPage = () => {
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (user) return <Navigate to="/lobby" replace />;

  const submitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
    } catch (error) {
      setErrorMessage(getSafeErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-center auth-page">
      <Card
        title="Tic Tac Toe Auth"
        rightAction={
          <Link className="btn-ghost" to="/">
            Home
          </Link>
        }
      >
        <form onSubmit={submitHandler} className="stack">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <input
            className="input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            minLength={6}
          />
          {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "Create new account" : "Have account? Login"}
          </button>
        </form>
      </Card>
    </div>
  );
};

export default AuthPage;

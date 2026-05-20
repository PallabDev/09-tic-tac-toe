import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const HomePage = () => {
  const { user, initializing } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="home-page">
      <nav className={`landing-nav ${scrolled ? "is-scrolled" : ""}`}>
        <Link className="brand-mark" to="/">
          T3 Arena
        </Link>
        <div className="nav-actions">
          <a href="#features" className="nav-link">
            Features
          </a>
          <Link className="btn-ghost nav-button" to={user ? "/lobby" : "/auth"}>
            {initializing ? "Loading..." : user ? "Lobby" : "Login"}
          </Link>
        </div>
      </nav>

      <main className="home-hero">
        <section className="hero-copy">
          <p className="eyebrow">Realtime tic tac toe</p>
          <h1>Fast two-player matches with live rooms.</h1>
          <p className="hero-text">
            Create a room, share the six digit code, and play smooth rounds with instant moves,
            replay support, and clean turn feedback.
          </p>
          <div className="hero-actions">
            <Link className="btn-primary hero-button" to={user ? "/lobby" : "/auth"}>
              {user ? "Go to Lobby" : "Start Playing"}
            </Link>
            <a className="btn-secondary hero-button" href="#features">
              See Features
            </a>
          </div>
        </section>

        <section className="hero-board" aria-label="Tic tac toe preview">
          {["X", "", "O", "", "X", "", "O", "", "X"].map((cell, index) => (
            <div className={`preview-cell ${cell ? `is-${cell.toLowerCase()}` : ""}`} key={index}>
              {cell}
            </div>
          ))}
        </section>
      </main>

      <section className="feature-band" id="features">
        <div>
          <span>01</span>
          <strong>Socket.IO rooms</strong>
          <p>Moves sync instantly for both players.</p>
        </div>
        <div>
          <span>02</span>
          <strong>Private codes</strong>
          <p>Invite a friend with a simple room code.</p>
        </div>
        <div>
          <span>03</span>
          <strong>Replay rounds</strong>
          <p>Restart together after a win or draw.</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

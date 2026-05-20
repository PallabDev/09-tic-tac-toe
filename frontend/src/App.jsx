import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import LobbyPage from "./pages/LobbyPage.jsx";
import RoomPage from "./pages/RoomPage.jsx";

const ProtectedRoute = ({ children }) => {
  const { user, initializing } = useAuth();
  if (initializing) return <div className="center-text">Loading...</div>;
  return user ? children : <Navigate to="/auth" replace />;
};

function App() {
  return (
    <div className="app-shell">
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <LobbyPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms/:roomId"
          element={
            <ProtectedRoute>
              <RoomPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;

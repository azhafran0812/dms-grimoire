import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Welcome from "./views/pages/Welcome";
import Login from "./views/pages/Login";
import DashboardDM from "./views/pages/DashboardDM";
import DashboardPlayer from "./views/pages/DashboardPlayer";
import { auth, db } from "./firebase";
import { ref, get } from "firebase/database";

function ProtectedRoute({ children, requiredRole }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }
      setUser(currentUser);
      try {
        const snap = await get(ref(db, `users/${currentUser.uid}/role`));
        const rawRole = (snap.val() || "").toLowerCase();
        const normalized = (rawRole === "dungeon_master" || rawRole === "dm") ? "dm" : "player";
        setRole(normalized);
      } catch (err) {
        console.warn("Role fetch error:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-grimoire-dark flex items-center justify-center text-grimoire-gold font-serif">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-grimoire-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs tracking-widest uppercase">Consulting the Grimoire...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If DM route requested, block regular players
  if (requiredRole === "dm" && role !== "dm") {
    return <Navigate to="/dashboard/player" replace />;
  }

  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard/dm"
          element={
            <ProtectedRoute requiredRole="dm">
              <DashboardDM />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/player"
          element={
            <ProtectedRoute>
              <DashboardPlayer />
            </ProtectedRoute>
          }
        />
        {/* Fallback to welcome */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";

import Raffle from "./Raffle";
import Participants from "./Participants";
import Artworks from "./Artworks";
import Admin from "./Admin";

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div style={{ display: "flex" }}>
        <Sidebar />

        <div style={{ padding: "2rem", width: "100%" }}>
          <Routes>
            <Route path="raffle" element={<Raffle />} />
            <Route path="participants" element={<Participants />} />
            <Route path="artworks" element={<Artworks />} />
            <Route path="admin" element={<Admin />} />
          </Routes>
        </div>
      </div>
    </ProtectedRoute>
  );
}

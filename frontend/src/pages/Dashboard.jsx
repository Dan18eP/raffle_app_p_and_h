import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";

import DashboardHome from "./DashboardHome";
import Raffle from "./Raffle";
import Participants from "./Participants";
import Artworks from "./Artworks";
import Admin from "./Admin";

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div style={{ display: "flex", alignItems: "stretch", minHeight: "100vh" }}>
        <Sidebar />

        <div className="dashboard-content">
          <Routes>
            <Route index element={<DashboardHome />} />
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

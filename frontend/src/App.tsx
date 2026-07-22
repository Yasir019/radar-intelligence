import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { useAuth } from "./context/AuthContext";
import BriefPage from "./pages/BriefPage";
import ChangeDetailPage from "./pages/ChangeDetailPage";
import CompetitorDetailPage from "./pages/CompetitorDetailPage";
import CompetitorsPage from "./pages/CompetitorsPage";
import DashboardPage from "./pages/DashboardPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import WarRoomPage from "./pages/WarRoomPage";

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/competitors" element={<CompetitorsPage />} />
        <Route path="/competitors/:id" element={<CompetitorDetailPage />} />
        <Route path="/changes/:id" element={<ChangeDetailPage />} />
        <Route path="/warroom" element={<WarRoomPage />} />
        <Route path="/brief" element={<BriefPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

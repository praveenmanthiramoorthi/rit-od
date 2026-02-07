import { Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import CompleteProfile from "./pages/CompleteProfile";
import VerifyOD from "./pages/VerifyOD";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, isAdmin, profileComplete, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={
            isAdmin ? <Navigate to="/admin" /> :
              user && !profileComplete ? <Navigate to="/complete-profile" /> :
                <LandingPage />
          } />
          <Route
            path="/admin"
            element={isAdmin ? <AdminDashboard /> : <Navigate to="/" />}
          />
          <Route
            path="/complete-profile"
            element={user && !profileComplete ? <CompleteProfile /> : <Navigate to="/" />}
          />
          <Route path="/dashboard" element={<div className="pt-32 px-4 text-center">Dashboard Coming Soon</div>} />
          <Route path="/verify" element={<VerifyOD />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;


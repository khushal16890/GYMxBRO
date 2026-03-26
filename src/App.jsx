import Navbar from "./components/navbar/Navbar";
import Sidebar from "./components/navbar/Sidebar/Sidebar";

import Home from "./pages/Home";
import Programs from "./pages/Programs";
import CustomPlan from "./pages/CustomPlan";
import Learn from "./pages/Learn";
import Exercises from "./pages/Exercises";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import "./App.css";

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <>
      <Navbar />

      <div className="main">
        <Sidebar />

        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            <Route path="/programs" element={<ProtectedRoute><Programs /></ProtectedRoute>} />
            <Route path="/custom-plan" element={<ProtectedRoute><CustomPlan /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
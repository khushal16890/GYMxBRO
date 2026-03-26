import Navbar from "./components/navbar/Navbar";
import Sidebar from "./components/navbar/Sidebar/Sidebar";

import Home from "./pages/Home";
import Programs from "./pages/Programs";
import CustomPlan from "./pages/CustomPlan";
import Learn from "./pages/Learn";
import Exercises from "./pages/Exercises";
import Profile from "./pages/Profile";

import { Routes, Route } from "react-router-dom";

import "./App.css";

function App() {
  return (
    <>
      <Navbar />

      <div className="main">
        <Sidebar />

        <div className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/custom-plan" element={<CustomPlan />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/exercises" element={<Exercises />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default App;
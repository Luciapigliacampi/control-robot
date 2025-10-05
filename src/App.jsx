import { Routes, Route, Navigate, Link } from "react-router-dom";
import ControlMobile from "./pages/ControlMobile.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="topbar">
        <nav className="topnav">
          <Link to="/control">Control</Link>
        </nav>
      </header>
      <main className="main">
        <Routes>
          <Route path="/control" element={<ControlMobile />} />
          <Route path="*" element={<Navigate to="/control" replace />} />
        </Routes>
      </main>
    </div>
  );
}

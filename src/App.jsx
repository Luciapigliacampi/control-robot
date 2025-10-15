import { Routes, Route, Navigate } from "react-router-dom";
import ControlMobile from "./pages/ControlMobile.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/control" element={<ControlMobile />} />
      <Route path="*" element={<Navigate to="/control" replace />} />
    </Routes>
  );
}

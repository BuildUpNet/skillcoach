import { Routes, Route, Navigate } from "react-router-dom";
import Projects from "../pages/Projects";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="/projects" element={<Projects />} />
    </Routes>
  );
}

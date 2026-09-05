import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import Projects from "../pages/Projects";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import SettingsGeneral from "../pages/SettingsGeneral";

function SignInWrapper() {
  const navigate = useNavigate();
  return (
    <SignIn
      onNavigateToSignUp={() => navigate("/signup")}
      onForgotPassword={() => alert("Password reset link will be sent to your email.")}
      onSuccess={() => navigate("/projects")}
    />
  );
}

function SignUpWrapper() {
  const navigate = useNavigate();
  return (
    <SignUp
      onNavigateToLogin={() => navigate("/")}
      onSuccess={() => navigate("/")}
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<SignInWrapper />} />
        <Route path="/signup" element={<SignUpWrapper />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/settings" element={<SettingsGeneral />} />
        <Route path="/settings/:tab" element={<SettingsGeneral />} />
        <Route path="/privacy" element={<SettingsGeneral defaultTab="Privacy" />} />
        <Route path="/timeline" element={<SettingsGeneral defaultTab="Timeline" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
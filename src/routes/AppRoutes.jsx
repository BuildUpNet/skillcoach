import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Projects from "../pages/Projects";
import SignUp from "../pages/SignUp";
import SignIn from "../pages/SignIn";

function SignUpWrapper() {
  const navigate = useNavigate();
  return <SignUp onNavigateToLogin={() => navigate('/signin')} onSuccess={() => {}} />;
}

function SignInWrapper() {
  const navigate = useNavigate();
  return (
    <SignIn
      onNavigateToSignUp={() => navigate('/signup')}
      onForgotPassword={() => alert('Password reset link will be sent to your email.')}
      onSuccess={() => navigate('/projects')}
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/projects" replace />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/signup" element={<SignUpWrapper />} />
      <Route path="/signin" element={<SignInWrapper />} />
      <Route path="/login" element={<Navigate to="/signin" replace />} />
    </Routes>
  );
}

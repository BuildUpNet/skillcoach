import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import GroupLayout from "../layouts/GroupLayout";
import Projects from "../pages/Projects";
import SignIn from "../pages/SignIn";
import SignUp from "../pages/SignUp";
import GroupDashboard from "../pages/group/Dashboard";
import GroupMyTasks from "../pages/group/MyTasks";
import GroupMyAssignments from "../pages/group/MyAssignments";
import GroupMyTimesheet from "../pages/group/MyTimesheet";
import GroupTimeSummary from "../pages/group/TimeSummary";
import GroupMembers from "../pages/group/Members";
import GroupInvite from "../pages/group/Invite";
import GroupTimeline from "../pages/group/Timeline";
import GroupLessons from "../pages/group/Lessons";
import GroupTasks from "../pages/group/Tasks";
import TaskDetail from "../pages/group/TaskDetail";

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
        <Route path="/projects/:groupId" element={<GroupLayout />}>
          <Route index element={<GroupDashboard />} />
          <Route path="my-tasks" element={<GroupMyTasks />} />
          <Route path="my-assignments" element={<GroupMyAssignments />} />
          <Route path="my-timesheet" element={<GroupMyTimesheet />} />
          <Route path="time-summary" element={<GroupTimeSummary />} />
          <Route path="members" element={<GroupMembers />} />
          <Route path="invite" element={<GroupInvite />} />
          <Route path="timeline" element={<GroupTimeline />} />
          <Route path="lessons" element={<GroupLessons />} />
          <Route path="tasks" element={<GroupTasks />} />
          <Route path="tasks/:taskId" element={<TaskDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
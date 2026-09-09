import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import AppLayout from "../layouts/AppLayout";
import GroupLayout from "../layouts/GroupLayout";
import RequireAuth from "../components/RequireAuth";
import { useAuth } from "../lib/AuthContext";
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
import CreateGroup from "../pages/CreateGroup";
import EditGroup from "../pages/EditGroup";
import BrowseGroups from "../pages/BrowseGroups";
import SettingsGeneral from "../pages/SettingsGeneral";
import MemberProfile from "../pages/MemberProfile";
import Instruction from "../pages/Instruction";
import Messages from "../pages/Messages";
import Badges from "../pages/Badges";
import Notes from "../pages/Notes";
import Credits from "../pages/Credits";
import CoachesCorner from "../pages/CoachesCorner";
import Members from "../pages/Members";
import Forums from "../pages/forum/Forums";
import ForumTopics from "../pages/forum/ForumTopics";
import ForumTopic from "../pages/forum/ForumTopic";

import UpgradePage from "../pages/UpgradePage";
import Notifications from "../pages/Notifications";

import MemberHome from "../pages/MemberHome";

import GroupCreateTask from "../pages/adminpages/GroupCreateTask";


function SignInWrapper() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  if (user) return <Navigate to="/projects" replace />;
  return (
    <SignIn
      onNavigateToSignUp={() => navigate("/signup")}
      onForgotPassword={() =>
        alert("Password reset link will be sent to your email.")
      }
      onSuccess={(user) => { signIn(user); navigate("/projects"); }}
    />
  );
}

function SignUpWrapper() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  if (user) return <Navigate to="/projects" replace />;
  return (
    <SignUp
      onNavigateToLogin={() => navigate("/")}
      onSuccess={(user) => { signIn(user); navigate("/projects"); }}
    />
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<SignInWrapper />} />
        <Route path="/signup" element={<SignUpWrapper />} />
        <Route path="/settings/upgrade" element={<UpgradePage />} />
        <Route element={<RequireAuth />}>
          <Route path="/home" element={<MemberHome />} />
          <Route path="/members/home" element={<MemberHome />} />
          <Route path="/member-home" element={<MemberHome />} />
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
          <Route path="/group/create" element={<CreateGroup />} />
          <Route path="/group/edit/:groupId" element={<EditGroup />} />
          <Route path="/group/browser" element={<BrowseGroups />} />
          <Route path="/profile/:username" element={<MemberProfile />} />
          <Route path="/settings" element={<SettingsGeneral />} />
          <Route path="/settings/:tab" element={<SettingsGeneral />} />
          <Route path="/instruction" element={<Instruction />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/badges" element={<Badges />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/coaches-corner" element={<CoachesCorner />} />
          <Route path="/members" element={<Members />} />
          <Route path="/forums" element={<Forums />} />
          <Route path="/forums/:forumId/:forumSlug" element={<ForumTopics />} />
          <Route path="/forums/topic/:topicId/:topicSlug" element={<ForumTopic />} />
          <Route path="/privacy" element={<SettingsGeneral defaultTab="Privacy" />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings/notifications" element={<SettingsGeneral defaultTab="Notifications" />} />
          <Route path="/timeline" element={<SettingsGeneral defaultTab="Timeline" />} />
          <Route path="/change-password" element={<SettingsGeneral defaultTab="Change Password" />} />
          <Route path="/delete-account" element={<SettingsGeneral defaultTab="Delete Account" />} />
          <Route path="/group/:id/create-task" element={<GroupCreateTask />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send/receive the httpOnly session cookie
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request to ${path} failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const getCategories = () => request("/api/categories");
export const getGroups = () => request("/api/groups");
export const getGroup = (id) => request(`/api/groups/${id}`);
export const createGroup = (data) =>
  request("/api/groups", { method: "POST", body: JSON.stringify(data) });
export const updateGroup = (id, data) =>
  request(`/api/groups/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteGroup = (id) =>
  request(`/api/groups/${id}`, { method: "DELETE" });
export const setGroupPhoto = (id, dataUrl) =>
  request(`/api/groups/${id}/photo`, { method: "PUT", body: JSON.stringify({ dataUrl }) });
export const deleteGroupPhoto = (id) =>
  request(`/api/groups/${id}/photo`, { method: "DELETE" });
export const getGroupTasks = (groupId) => request(`/api/groups/${groupId}/tasks`);
export const createGroupTask = (groupId, data) =>
  request(`/api/groups/${groupId}/tasks`, { method: "POST", body: JSON.stringify(data) });
export const updateGroupTask = (groupId, taskId, data) =>
  request(`/api/groups/${groupId}/tasks/${taskId}`, { method: "PUT", body: JSON.stringify(data) });
export const toggleTaskDone = (groupId, taskId, done) =>
  request(`/api/groups/${groupId}/tasks/${taskId}/done`, { method: "PATCH", body: JSON.stringify({ done }) });
export const addTaskComment = (groupId, taskId, data) =>
  request(`/api/groups/${groupId}/tasks/${taskId}/comments`, { method: "POST", body: JSON.stringify(data) });
export const deleteGroupTask = (groupId, taskId) =>
  request(`/api/groups/${groupId}/tasks/${taskId}`, { method: "DELETE" });
export const deleteTaskComment = (groupId, taskId, commentId) =>
  request(`/api/groups/${groupId}/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
export const deleteAssignment = (groupId, taskId, assignmentId) =>
  request(`/api/groups/${groupId}/tasks/${taskId}/assignments/${assignmentId}`, { method: "DELETE" });
export const deleteAssignmentComment = (groupId, taskId, assignmentId, commentId) =>
  request(`/api/groups/${groupId}/tasks/${taskId}/assignments/${assignmentId}/comments/${commentId}`, { method: "DELETE" });
export const createAssignment = (groupId, taskId, data) =>
  request(`/api/groups/${groupId}/tasks/${taskId}/assignments`, { method: "POST", body: JSON.stringify(data) });
export const toggleAssignmentDone = (groupId, taskId, assignmentId, done) =>
  request(`/api/groups/${groupId}/tasks/${taskId}/assignments/${assignmentId}`, {
    method: "PATCH",
    body: JSON.stringify({ done }),
  });
export const addAssignmentComment = (groupId, taskId, assignmentId, data) =>
  request(`/api/groups/${groupId}/tasks/${taskId}/assignments/${assignmentId}/comments`, {
    method: "POST",
    body: JSON.stringify(data),
  });
export const addAssignmentHours = (groupId, taskId, assignmentId, data) =>
  request(`/api/groups/${groupId}/tasks/${taskId}/assignments/${assignmentId}/hours`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const getGroupMembers = (groupId) => request(`/api/groups/${groupId}/members`);
export const getGroupInvites = (groupId) => request(`/api/groups/${groupId}/members/invites`);
export const inviteMember = (groupId, email) =>
  request(`/api/groups/${groupId}/members/invite`, { method: "POST", body: JSON.stringify({ email }) });

export const getMyTimesheet = (groupId) => request(`/api/groups/${groupId}/timesheet`);
export const getTimeSummary = (groupId) => request(`/api/groups/${groupId}/time-summary`);
export const getGroupTimeline = (groupId) => request(`/api/groups/${groupId}/timeline`);

export const register = (data) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
export const login = (data) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
export const logout = () => request("/api/auth/logout", { method: "POST" });
export const getMe = () => request("/api/auth/me");
export const changePassword = (data) =>
  request("/api/auth/me/password", { method: "PUT", body: JSON.stringify(data) });

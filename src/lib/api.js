const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    credentials: "include", // send/receive the httpOnly session cookie
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request to ${path} failed (${res.status})`);
    err.status = res.status;
    throw err;
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
export const removeMember = (groupId, userId) =>
  request(`/api/groups/${groupId}/members/${userId}`, { method: "DELETE" });
export const cancelInvite = (groupId, userId) =>
  request(`/api/groups/${groupId}/members/invites/${userId}`, { method: "DELETE" });

export const getGroupManage = (groupId) => request(`/api/groups/${groupId}/settings/manage`);
export const promoteOfficer = (groupId, userId) =>
  request(`/api/groups/${groupId}/settings/officers`, { method: "POST", body: JSON.stringify({ userId }) });
export const demoteOfficer = (groupId, userId) =>
  request(`/api/groups/${groupId}/settings/officers/${userId}`, { method: "DELETE" });
export const setGroupPrivacy = (groupId, action, minRole) =>
  request(`/api/groups/${groupId}/settings/privacy/${action}`, { method: "PUT", body: JSON.stringify({ minRole }) });

export const getMyTimesheet = (groupId) => request(`/api/groups/${groupId}/timesheet`);
export const getTimeSummary = (groupId) => request(`/api/groups/${groupId}/time-summary`);
export const getGroupTimeline = (groupId) => request(`/api/groups/${groupId}/timeline`);

// auth
export const register = (data) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
export const login = (data) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
export const logout = () => request("/api/auth/logout", { method: "POST" });
export const getMe = () => request("/api/auth/me");
export const changePassword = (data) =>
  request("/api/auth/me/password", { method: "PUT", body: JSON.stringify(data) });

// settings
export const getGeneralSettings = () => request("/api/settings/general");
export const updateGeneralSettings = (data) =>
  request("/api/settings/general", { method: "PUT", body: JSON.stringify(data) });
export const googleLoginUrl = () => `${BASE_URL}/api/auth/google`;
export const disconnectFacebook = () => request("/api/settings/facebook", { method: "DELETE" });
export const disconnectTwitter = () => request("/api/settings/twitter", { method: "DELETE" });

// OAuth is a full-page redirect, not fetch:
export const facebookConnectUrl = () => `${BASE_URL}/api/auth/facebook/start?mode=connect`;
export const facebookLoginUrl = () => `${BASE_URL}/api/auth/facebook/start?mode=login`;

// notifications & invites
export const getNotifications = (limit = 20) => request(`/api/notifications?limit=${limit}`);
export const markNotificationRead = (id) => request(`/api/notifications/${id}/read`, { method: "PATCH" });
export const markAllNotificationsRead = () => request("/api/notifications/read-all", { method: "PATCH" });
export const getMyInvites = () => request("/api/invites");
export const acceptInvite = (groupId) => request(`/api/invites/${groupId}/accept`, { method: "POST" });
export const rejectInvite = (groupId) => request(`/api/invites/${groupId}/reject`, { method: "POST" });

// Admin — roles/levels and user management
export const getAdminLevels = () => request("/api/admin/levels");
export const createAdminLevel = (data) => request("/api/admin/levels", { method: "POST", body: JSON.stringify(data) });
export const updateAdminLevel = (id, data) => request(`/api/admin/levels/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const deleteAdminLevel = (id) => request(`/api/admin/levels/${id}`, { method: "DELETE" });
export const setDefaultLevel = (id) => request(`/api/admin/levels/${id}/set-default`, { method: "PUT" });
export const getAdminUsers = (search = "") => request(`/api/admin/users?search=${encodeURIComponent(search)}`);
export const updateUserLevel = (userId, levelId) =>
  request(`/api/admin/users/${userId}/level`, { method: "PUT", body: JSON.stringify({ levelId }) });
export const setUserStatus = (userId, enabled) =>
  request(`/api/admin/users/${userId}/status`, { method: "PATCH", body: JSON.stringify({ enabled }) });
export const impersonateUser = (userId) =>
  request(`/api/admin/users/${userId}/impersonate`, { method: "POST" });
export const stopImpersonating = () => request("/api/auth/stop-impersonating", { method: "POST" });

export const getAdminGroups = (search = "") => request(`/api/admin/groups?search=${encodeURIComponent(search)}`);
export const deleteAdminGroup = (groupId) => request(`/api/admin/groups/${groupId}`, { method: "DELETE" });

export const getAdminCategories = () => request("/api/admin/categories");
export const createAdminCategory = (title) => request("/api/admin/categories", { method: "POST", body: JSON.stringify({ title }) });
export const updateAdminCategory = (id, title) => request(`/api/admin/categories/${id}`, { method: "PUT", body: JSON.stringify({ title }) });
export const deleteAdminCategory = (id) => request(`/api/admin/categories/${id}`, { method: "DELETE" });

export const getLoginLogs = (limit = 100) => request(`/api/admin/login-logs?limit=${limit}`);
export const clearLoginLogs = () => request("/api/admin/login-logs", { method: "DELETE" });

export const getAdminSettings = () => request("/api/admin/settings");
export const setAdminSetting = (name, value) =>
  request(`/api/admin/settings/${encodeURIComponent(name)}`, { method: "PUT", body: JSON.stringify({ value }) });
export const deleteAdminSetting = (name) =>
  request(`/api/admin/settings/${encodeURIComponent(name)}`, { method: "DELETE" });

// member profiles
export const getMember = (username) => request(`/api/profiles/${encodeURIComponent(username)}`);
export const postStatus = (text) =>
  request("/api/profiles/status", { method: "POST", body: JSON.stringify({ text }) });

// edit my profile
export const getMyProfileEdit = () => request("/api/me/profile");
export const saveIntroduction = (data) => request("/api/me/profile/introduction", { method: "PUT", body: JSON.stringify(data) });
export const saveProfileFields = (values) => request("/api/me/profile/fields", { method: "PUT", body: JSON.stringify({ values }) });
export const saveProfilePhoto = (dataUrl) => request("/api/me/profile/photo", { method: "PUT", body: JSON.stringify({ dataUrl }) });
export const removeProfilePhoto = () => request("/api/me/profile/photo", { method: "DELETE" });
export const saveProfileSettings = (data) => request("/api/me/profile/settings", { method: "PUT", body: JSON.stringify(data) });
export const togglePostLike = (postId) => request(`/api/profiles/posts/${postId}/like`, { method: "POST" });
export const getPostComments = (postId) => request(`/api/profiles/posts/${postId}/comments`);
export const addPostComment = (postId, body) =>
  request(`/api/profiles/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ body }) });

// members & friends
export const getMembers = ({ q = "", type = "", photo = false, page = 1 } = {}) =>
  request(`/api/members?${new URLSearchParams({ q, type, photo: photo ? "1" : "", page })}`);
export const getFriendRequests = () => request("/api/members/requests");
export const sendFriendRequest = (id) => request(`/api/members/${id}/request`, { method: "POST" });
export const cancelFriendRequest = (id) => request(`/api/members/${id}/request`, { method: "DELETE" });
export const acceptFriendRequest = (id) => request(`/api/members/${id}/accept`, { method: "POST" });
export const declineFriendRequest = (id) => request(`/api/members/${id}/decline`, { method: "POST" });
export const removeFriend = (id) => request(`/api/members/${id}/friend`, { method: "DELETE" });
export const blockMember = (id) => request(`/api/members/${id}/block`, { method: "POST" });
export const unblockMember = (id) => request(`/api/members/${id}/block`, { method: "DELETE" });
export const reportMember = (id, data) => request(`/api/members/${id}/report`, { method: "POST", body: JSON.stringify(data) });

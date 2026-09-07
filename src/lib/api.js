const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// No auth system yet — every group created from this app belongs to this
// fixed user id (must match server/index.js's CURRENT_USER_ID).
export const CURRENT_USER_ID = 1;

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
export const getGroupTasks = (groupId) => request(`/api/groups/${groupId}/tasks`);

export const register = (data) =>
  request("/api/auth/register", { method: "POST", body: JSON.stringify(data) });
export const login = (data) =>
  request("/api/auth/login", { method: "POST", body: JSON.stringify(data) });
export const logout = () => request("/api/auth/logout", { method: "POST" });
export const getMe = () => request("/api/auth/me");
export const changePassword = (data) =>
  request("/api/auth/me/password", { method: "PUT", body: JSON.stringify(data) });

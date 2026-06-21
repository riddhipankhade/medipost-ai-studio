// Mock role-based auth for demo. Replace with Lovable Cloud auth later.
export type Role = "user" | "admin";
const KEY = "medipost_role";

export function setRole(role: Role) {
  if (typeof window !== "undefined") localStorage.setItem(KEY, role);
}
export function clearRole() {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
}
export function getRole(): Role | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem(KEY);
  return v === "admin" || v === "user" ? v : null;
}
export function isAdmin() {
  return getRole() === "admin";
}
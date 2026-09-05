import { apiFetch, clearAuthToken, setAuthToken } from "./client";
import type { Profile, ProfileInput } from "@/types/profile";

type LoginResponse = { token: string; profile: Profile };

export async function login(email: string, password: string) {
  const data = await apiFetch<LoginResponse>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  setAuthToken(data.token);
  return data.profile;
}

export async function logout() {
  try {
    await apiFetch<void>("/api/auth/logout/", { method: "POST" });
  } finally {
    clearAuthToken();
  }
}

export function getMe() {
  return apiFetch<Profile>("/api/me/");
}

export function updateProfile(input: Partial<ProfileInput>) {
  return apiFetch<Profile>("/api/me/", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export function changePassword(oldPassword: string, newPassword: string) {
  return apiFetch<void>("/api/auth/change-password/", {
    method: "POST",
    body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
  });
}

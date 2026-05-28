import { apiFetch, clearAuthToken, setAuthToken } from "./client";
import type { Profile } from "@/types/profile";

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

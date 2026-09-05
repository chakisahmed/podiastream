export type ProfileRole = "podologue" | "assistant" | "admin";

export const PROFILE_ROLES: ProfileRole[] = ["podologue", "assistant", "admin"];

export const PROFILE_ROLE_LABELS: Record<ProfileRole, string> = {
  podologue: "Podologue",
  assistant: "Assistant(e)",
  admin: "Administrateur",
};

export type Profile = {
  id: string;
  full_name: string;
  role: ProfileRole;
  phone: string;
  created_at: string;
};

export type ProfileInput = Pick<Profile, "full_name" | "role" | "phone">;

export type ProfileRole = "podologue" | "assistant" | "admin";

export type Profile = {
  id: string;
  full_name: string;
  role: ProfileRole;
  phone: string;
  created_at: string;
};

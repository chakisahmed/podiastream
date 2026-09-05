"use client";

import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/shared/material-icon";
import { changePassword, getMe, updateProfile } from "@/lib/api/auth";
import { PROFILE_ROLE_LABELS, PROFILE_ROLES } from "@/types/profile";
import type { ProfileRole } from "@/types/profile";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<ProfileRole>("podologue");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    getMe()
      .then((data) => {
        setFullName(data.full_name);
        setRole(data.role);
        setPhone(data.phone);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erreur"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    setError(null);
    setProfileSaved(false);
    try {
      await updateProfile({ full_name: fullName, role, phone });
      setProfileSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSaved(false);
    if (newPassword !== confirmPassword) {
      setPasswordError("Les nouveaux mots de passe ne correspondent pas.");
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Erreur lors du changement de mot de passe");
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return <p className="font-body-md text-body-md text-on-surface-variant">Chargement...</p>;
  }

  return (
    <>
      <h1 className="font-headline-xl text-headline-lg-mobile md:text-headline-xl text-on-surface">
        Paramètres
      </h1>

      {error && (
        <p className="text-error font-body-sm text-body-sm" role="alert">
          {error}
        </p>
      )}

      <div className="glass-panel rounded-xl p-container-padding">
        <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
          <MaterialIcon name="badge" className="text-primary" />
          Profil praticien
        </h2>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3 max-w-md">
          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Nom complet</span>
            <input
              className="glass-input rounded-lg px-3 py-2 text-on-surface"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Rôle</span>
            <select
              className="glass-input rounded-lg px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value as ProfileRole)}
            >
              {PROFILE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {PROFILE_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">Téléphone</span>
            <input
              className="glass-input rounded-lg px-3 py-2 text-on-surface"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>

          {profileSaved && (
            <p className="text-primary font-body-sm text-body-sm">Profil mis à jour.</p>
          )}

          <button
            type="submit"
            disabled={savingProfile}
            className="self-start bg-primary text-on-primary rounded-lg px-4 py-2 font-label-md hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {savingProfile ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </div>

      <div className="glass-panel rounded-xl p-container-padding">
        <h2 className="font-headline-md text-headline-md mb-4 flex items-center gap-2">
          <MaterialIcon name="lock" className="text-primary" />
          Sécurité
        </h2>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-3 max-w-md">
          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Mot de passe actuel
            </span>
            <input
              type="password"
              required
              className="glass-input rounded-lg px-3 py-2 text-on-surface"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Nouveau mot de passe
            </span>
            <input
              type="password"
              required
              className="glass-input rounded-lg px-3 py-2 text-on-surface"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              Confirmer le nouveau mot de passe
            </span>
            <input
              type="password"
              required
              className="glass-input rounded-lg px-3 py-2 text-on-surface"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>

          {passwordError && (
            <p className="text-error font-body-sm text-body-sm" role="alert">
              {passwordError}
            </p>
          )}
          {passwordSaved && (
            <p className="text-primary font-body-sm text-body-sm">Mot de passe modifié.</p>
          )}

          <button
            type="submit"
            disabled={savingPassword}
            className="self-start bg-primary text-on-primary rounded-lg px-4 py-2 font-label-md hover:bg-primary/90 transition-colors disabled:opacity-60"
          >
            {savingPassword ? "Enregistrement..." : "Changer le mot de passe"}
          </button>
        </form>
      </div>
    </>
  );
}

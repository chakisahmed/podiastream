"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      await login(email, password);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-surface-container-high via-surface to-surface-container-highest opacity-70" />
      <form
        onSubmit={handleSubmit}
        className="glass-modal rounded-xl p-container-padding w-full max-w-sm flex flex-col gap-gutter"
      >
        <div className="text-center mb-2">
          <h1 className="font-headline-lg text-headline-lg text-primary">PodiaStream</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
            Connexion praticien
          </p>
        </div>

        <label className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="glass-input rounded-lg px-3 py-2 text-on-surface"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="font-label-sm text-label-sm text-on-surface-variant">Mot de passe</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input rounded-lg px-3 py-2 text-on-surface"
          />
        </label>

        {error && (
          <p className="text-error font-body-sm text-body-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="bg-primary text-on-primary rounded-lg py-2 font-label-md hover:bg-primary/90 transition-colors disabled:opacity-60"
        >
          {pending ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}

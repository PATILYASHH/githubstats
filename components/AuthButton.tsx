"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GithubIcon, BIcon } from "./icons";

export interface SessionUser {
  login: string;
  avatarUrl: string | null;
}

export default function AuthButton({ user }: { user: SessionUser | null }) {
  const [loading, setLoading] = useState(false);

  async function signIn() {
    setLoading(true);
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      alert("Sign-in isn't configured yet (Supabase env vars missing).");
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setLoading(false);
      alert("Sign-in failed. Is GitHub OAuth configured in Supabase?");
    }
    // On success the browser is redirected to GitHub.
  }

  if (user) {
    return (
      <div className="auth-pill">
        {user.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatarUrl} alt="" width={22} height={22} />
        )}
        <span className="auth-login">{user.login}</span>
        <form action="/auth/signout" method="post">
          <button type="submit" className="auth-signout" title="Sign out">
            <BIcon name="box-arrow-right" size={14} /> Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <button
      type="button"
      className="auth-signin"
      onClick={signIn}
      disabled={loading}
    >
      <GithubIcon size={16} />
      {loading ? "Redirecting…" : "Sign in"}
    </button>
  );
}

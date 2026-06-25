"use client";

import { FormEvent, useState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type LoginState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<LoginState>({ status: "idle" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ status: "loading" });

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setState({ status: "error", message: error.message });
        return;
      }

      setState({ status: "success", message: "Check your email for the login link." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not send login link.";
      setState({ status: "error", message });
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label htmlFor="email">Email</label>
      <div className="input-row">
        <input
          id="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          type="email"
          value={email}
        />
        <button disabled={state.status === "loading"} type="submit">
          {state.status === "loading" ? <LoadingIndicator compact label="Sending" /> : "Send magic link"}
        </button>
      </div>
      {state.status === "success" ? <div className="success-box">{state.message}</div> : null}
      {state.status === "error" ? <div className="error-box">{state.message}</div> : null}
    </form>
  );
}

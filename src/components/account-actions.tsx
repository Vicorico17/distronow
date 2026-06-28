"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";

export function ClaimAnonymousProjectsButton() {
  const router = useRouter();
  const [state, setState] = useState<
    | { status: "idle" }
    | { status: "loading" }
    | { status: "success"; message: string }
    | { status: "error"; message: string }
  >({ status: "idle" });

  async function claimProjects() {
    setState({ status: "loading" });

    const response = await fetch("/api/account/claim-anonymous", {
      method: "POST"
    });
    const payload = (await response.json().catch(() => ({}))) as {
      claimed?: { projects?: number };
      error?: string;
    };

    if (!response.ok) {
      setState({ status: "error", message: payload.error ?? "Could not claim projects." });
      return;
    }

    setState({ status: "success", message: `Claimed ${payload.claimed?.projects ?? 0} anonymous projects.` });
    router.refresh();
  }

  return (
    <div className="account-action-row">
      <button disabled={state.status === "loading"} onClick={claimProjects} type="button">
        {state.status === "loading" ? <LoadingIndicator compact label="Claiming" /> : "Claim anonymous projects"}
      </button>
      {state.status === "success" ? <small className="success-text">{state.message}</small> : null}
      {state.status === "error" ? <small className="danger-text">{state.message}</small> : null}
    </div>
  );
}

export function LogoutButton() {
  return (
    <form action="/auth/logout" method="post">
      <button className="secondary-action" type="submit">
        Log out
      </button>
    </form>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoadingIndicator } from "@/components/loading-indicator";

export function ProjectDeleteButton({ projectId, projectName }: { projectId: string; projectName: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteProject() {
    const confirmed = window.confirm(`Delete ${projectName}? This removes its saved brand data and generated assets.`);

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError(null);

    const response = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE"
    });
    const payload = (await response.json().catch(() => ({}))) as {
      error?: string;
    };

    setIsDeleting(false);

    if (!response.ok) {
      setError(payload.error ?? "Could not delete project.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="project-delete-area">
      <button disabled={isDeleting} onClick={deleteProject} type="button">
        {isDeleting ? <LoadingIndicator compact label="Deleting" /> : "Delete"}
      </button>
      {error ? <small>{error}</small> : null}
    </div>
  );
}

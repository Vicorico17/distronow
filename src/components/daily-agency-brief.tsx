"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { funnel, stateSchema } from "@/lib/acquisition";

export function DailyAgencyBrief({
  projectId,
  approved,
}: {
  projectId: string;
  approved: number;
}) {
  const [summary, setSummary] = useState<{
    buyers: number;
    booked: number;
    review: number;
  } | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    void fetch(`/api/projects/${projectId}/acquisition`, { cache: "no-store" })
      .then(async (r) => {
        const payload = await r.json();
        if (!r.ok)
          throw new Error(payload.error || "Acquisition is unavailable.");
        const state = stateSchema.parse(payload.state);
        const metrics = funnel(state);
        if (active)
          setSummary({
            buyers: metrics.buyers,
            booked: metrics.booked,
            review: state.prospects.filter(
              (p) => p.status === "candidate" || p.draftStatus === "draft",
            ).length,
          });
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [projectId]);
  const base = `/projects/${projectId}`;
  return (
    <section className="daily-brief">
      <p className="eyebrow">YOUR AGENCY TODAY</p>
      <h2>What needs your attention?</h2>
      <div className="daily-brief-grid">
        <Link href={`${base}/assets`}>
          <strong>{approved}</strong>
          <span>Approved posts →</span>
        </Link>
        <Link href={`${base}/acquisition`}>
          <strong>{summary?.review ?? "—"}</strong>
          <span>Buyer & draft reviews →</span>
        </Link>
        <Link href={`${base}/acquisition`}>
          <strong>{summary?.buyers ?? "—"}</strong>
          <span>Buyers in your pipeline →</span>
        </Link>
        <Link href={`${base}/acquisition`}>
          <strong>{summary?.booked ?? "—"}</strong>
          <span>Recorded meetings →</span>
        </Link>
      </div>
      {error && <p role="status">Acquisition: {error}</p>}
      <p>
        Acquisition tracks buyer conversations. Publishing plans and approved
        posts are available in the content workspace.
      </p>
    </section>
  );
}

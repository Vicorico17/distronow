export function LoadingIndicator({ label, compact = false }: { label: string; compact?: boolean }) {
  return (
    <span className={compact ? "loading-indicator loading-indicator-compact" : "loading-indicator"} role="status">
      <span className="loading-spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Account = {
  id: string;
  email: string;
  label: string;
  instagram_username: string;
  tiktok_username: string;
  updated_at: string;
};

export function AccmanAccountVault() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Account | null>(null);
  const [password, setPassword] = useState<{ id: string; value: string } | null>(null);
  const [message, setMessage] = useState("Loading accounts...");
  const [busy, setBusy] = useState(false);
  const [importText, setImportText] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), search: query });
    const response = await fetch(`/api/accman/accounts?${params}`, { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Could not load accounts.");
    setAccounts(result.accounts);
    setTotal(result.total);
    setMessage("");
  }, [page, query]);

  // Load account rows when the search or page changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load().catch((error) => setMessage(error.message)); }, [load]);

  async function send(body: Record<string, unknown>) {
    const response = await fetch("/api/accman/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify(body),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Account action failed.");
    return result;
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setBusy(true);
    setMessage("Saving account...");
    try {
      await send({
        action: editing ? "update" : "create",
        ...(editing ? { id: editing.id } : {}),
        email: values.get("email"),
        label: values.get("label"),
        instagramUsername: values.get("instagramUsername"),
        tiktokUsername: values.get("tiktokUsername"),
        ...(values.get("emailPassword") ? { emailPassword: values.get("emailPassword") } : {}),
      });
      form.reset();
      setEditing(null);
      setPassword(null);
      setPage(0);
      await load();
      setMessage("Account saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save account."); }
    finally { setBusy(false); }
  }

  async function remove(account: Account) {
    if (!window.confirm(`Delete ${account.email} and its saved password?`)) return;
    setBusy(true);
    try {
      await send({ action: "delete", id: account.id });
      if (password?.id === account.id) setPassword(null);
      if (editing?.id === account.id) setEditing(null);
      await load();
      setMessage("Account deleted.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not delete account."); }
    finally { setBusy(false); }
  }

  async function reveal(account: Account) {
    if (password?.id === account.id) { setPassword(null); return; }
    try {
      const result = await send({ action: "reveal", id: account.id });
      setPassword({ id: account.id, value: result.password });
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not show password."); }
  }

  async function importRows(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const lines = importText.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length > 100) { setMessage("Import up to 100 rows at a time."); return; }
    const cells = lines.map((line) => line.split("\t").map((cell) => cell.trim()));
    if (cells.some((row) => row.length < 4 || row.length > 5 || row.slice(0, 4).some((cell) => !cell))) {
      setMessage("Each row needs email, password, Instagram, and TikTok, separated by tabs.");
      return;
    }
    setBusy(true);
    setMessage("Importing accounts...");
    try {
      const result = await send({ action: "import", rows: cells.map(([email, emailPassword, instagramUsername, tiktokUsername, label = ""]) => ({ email, emailPassword, instagramUsername, tiktokUsername, label })) });
      setImportText("");
      setPage(0);
      await load();
      setMessage(`Imported ${result.imported} accounts.`);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not import accounts."); }
    finally { setBusy(false); }
  }

  return (
    <section className="accman-vault">
      <div className="core-utility-header">
        <div><p className="eyebrow">Account vault</p><h2>Emails and social accounts</h2><p>One email per row, with its Instagram and TikTok usernames. Passwords are encrypted on the server and hidden by default.</p></div>
        <strong>{total} email{total === 1 ? "" : "s"}</strong>
      </div>
      <form key={editing?.id ?? "new"} className="core-utility-form accman-vault-form" onSubmit={save} autoComplete="off">
        <div className="operation-panel-head"><span>{editing ? `Edit ${editing.email}` : "Add an account set"}</span><small>Both social usernames required</small></div>
        <div className="accman-vault-fields">
          <label>Account name <input name="label" defaultValue={editing?.label ?? ""} placeholder="Optional label" maxLength={120} /></label>
          <label>Email <input name="email" type="email" defaultValue={editing?.email ?? ""} placeholder="name@example.com" required maxLength={254} autoComplete="off" /></label>
          <label>Email password <input name="emailPassword" type="password" placeholder={editing ? "Leave blank to keep saved password" : "Email password"} required={!editing} maxLength={4096} autoComplete="new-password" /></label>
          <label>Instagram username <input name="instagramUsername" defaultValue={editing?.instagram_username ?? ""} placeholder="@instagram" required maxLength={100} /></label>
          <label>TikTok username <input name="tiktokUsername" defaultValue={editing?.tiktok_username ?? ""} placeholder="@tiktok" required maxLength={100} /></label>
        </div>
        <div className="accman-vault-actions"><button className="primary-action" disabled={busy} type="submit">{editing ? "Save changes" : "Add account"}</button>{editing && <button className="secondary-action" type="button" onClick={() => setEditing(null)}>Cancel</button>}</div>
      </form>
      <details className="accman-vault-import">
        <summary>Bulk add from a spreadsheet</summary>
        <form onSubmit={importRows}>
          <p>Paste up to 100 tab-separated rows. Columns: email, email password, Instagram username, TikTok username, optional account name. Existing emails stop the import.</p>
          <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={"name@example.com\tpassword\t@instagram\t@tiktok\tAccount name"} aria-label="Account rows to import" required spellCheck={false} />
          <button className="secondary-action" type="submit" disabled={busy}>Import {importText.trim() ? importText.trim().split(/\r?\n/).length : ""} accounts</button>
        </form>
      </details>
      <form className="accman-vault-search" onSubmit={(event) => { event.preventDefault(); setPage(0); setQuery(search); }}>
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by email" aria-label="Search accounts by email" />
        <button className="secondary-action" type="submit">Search</button>
        {query && <button className="secondary-action" type="button" onClick={() => { setSearch(""); setQuery(""); setPage(0); }}>Clear</button>}
      </form>
      <p className="accman-vault-message" role="status">{message}</p>
      <div className="accman-vault-list">
        {accounts.map((account) => <article key={account.id}>
          <div><small>{account.label || "Account set"}</small><strong>{account.email}</strong><span>Instagram: @{account.instagram_username} · TikTok: @{account.tiktok_username}</span>{password?.id === account.id && <code className="accman-vault-password">{password.value}</code>}</div>
          <div className="accman-vault-row-actions"><button type="button" disabled={busy} onClick={() => void reveal(account)}>{password?.id === account.id ? "Hide password" : "Show password"}</button><button type="button" disabled={busy} onClick={() => { setEditing(account); setPassword(null); }}>Edit</button><button type="button" disabled={busy} onClick={() => void remove(account)}>Delete</button></div>
        </article>)}
        {!accounts.length && !message && <p>No accounts found. Add the first email above.</p>}
      </div>
      {total > 50 && <div className="accman-vault-pagination"><button className="secondary-action" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button><span>Page {page + 1} of {Math.ceil(total / 50)}</span><button className="secondary-action" disabled={(page + 1) * 50 >= total} onClick={() => setPage(page + 1)}>Next</button></div>}
    </section>
  );
}

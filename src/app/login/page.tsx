import Link from "next/link";
import { LoginForm } from "@/components/login-form";

export default function LoginPage() {
  return (
    <main>
      <section className="project-hero">
        <nav>
          <Link href="/">DistroNow</Link>
          <Link className="nav-action" href="/">
            New brand
          </Link>
        </nav>
      </section>

      <section className="login-panel">
        <div>
          <p className="eyebrow">Supabase Auth</p>
          <h1>Log in to manage brand workspaces.</h1>
          <p>
            Magic-link auth is the first account layer. Ownership and row-level access rules will come next.
          </p>
        </div>
        <LoginForm />
      </section>
    </main>
  );
}

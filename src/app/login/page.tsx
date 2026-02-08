import { LoginForm } from "@/components/LoginForm";

export default function Page() {
  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight">Sign in</h1>
      <p className="mt-2 text-white/75">Create an account or sign in to list homes and message.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
    </main>
  );
}

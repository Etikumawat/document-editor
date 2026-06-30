import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import LoginButton from "~/components/ui/login-button";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <div className="bg-muted/40 flex min-h-screen items-center justify-center px-4 dark:bg-zinc-900">
      <div className="bg-background w-full max-w-sm rounded-2xl border p-8 text-center shadow-lg">
        <div className="mb-2 flex items-center justify-center gap-2">
          <div className="bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-xl">
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold">CollabDoc</h1>
        </div>
        <p className="text-muted-foreground mb-8 text-sm">
          Local-first collaborative document editor
        </p>
        <LoginButton />
        <p className="text-muted-foreground mt-6 text-xs">
          Sign in with your Google account to get started
        </p>
      </div>
    </div>
  );
}

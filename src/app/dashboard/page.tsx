import { redirect } from "next/navigation";
import { auth } from "~/server/auth";

export default async function Dashboard() {
  try {
    const session = await auth();

    if (!session) {
      redirect("/api/auth/signin");
    }

    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p>Welcome {session.user?.name}</p>
        <p>Email: {session.user?.email}</p>
        <p>Auth working! Now testing DB...</p>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-10">
        <h1 className="text-2xl font-bold text-red-500">Error</h1>
        <p>{error instanceof Error ? error.message : String(error)}</p>
      </div>
    );
  }
}

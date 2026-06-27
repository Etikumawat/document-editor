import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import CreateDocumentButton from "~/components/ui/create-document-button";
import SyncStatus from "~/components/ui/sync-status";

export default async function Dashboard() {
  const session = await auth();
  if (!session) redirect("/api/auth/signin");

  const documents = await db.document.findMany({
    where: { ownerId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="bg-background min-h-screen">
      {/* Navbar */}
      <nav className="flex items-center justify-between border-b px-6 py-3">
        <h1 className="text-xl font-semibold">📝 DocEditor</h1>
        <div className="flex items-center gap-4">
          <SyncStatus />
          <span className="text-muted-foreground text-sm">
            {session.user.name}
          </span>
          <Link href="/api/auth/signout">
            <Button variant="outline" size="sm">
              Sign out
            </Button>
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Documents</h2>
          <CreateDocumentButton />
        </div>

        {documents.length === 0 ? (
          <div className="text-muted-foreground py-20 text-center">
            <p className="text-lg">No documents yet</p>
            <p className="mt-1 text-sm">
              Create your first document to get started
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {documents.map((doc) => (
              <Link key={doc.id} href={`/editor/${doc.id}`}>
                <div className="hover:bg-accent cursor-pointer rounded-lg border p-4 transition-colors">
                  <h3 className="font-medium">{doc.title}</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Updated {new Date(doc.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import CreateDocumentButton from "~/components/ui/create-document-button";
import ThemeToggle from "~/components/ui/theme-toggle";
import SyncStatusWrapper from "~/components/ui/sync-status-wrapper";
import DeleteDocumentButton from "~/components/ui/delete-document-button";

const PAGE_SIZE = 10;

interface DashboardProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function Dashboard({ searchParams }: DashboardProps) {
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const { page } = await searchParams;
  const currentPage = Math.max(1, parseInt(page ?? "1"));
  const skip = (currentPage - 1) * PAGE_SIZE;

  try {
    const user = await db.user.upsert({
      where: { email: session.user.email },
      update: {
        name: session.user.name ?? undefined,
        image: session.user.image ?? undefined,
      },
      create: {
        email: session.user.email,
        name: session.user.name ?? "Anonymous",
        image: session.user.image ?? null,
      },
    });

    const totalDocuments = await db.document.count({
      where: { ownerId: user.id },
    });

    const totalPages = Math.ceil(totalDocuments / PAGE_SIZE);

    const documents = await db.document.findMany({
      where: { ownerId: user.id },
      orderBy: { updatedAt: "desc" },
      include: { collaborators: true },
      skip,
      take: PAGE_SIZE,
    });

    const sharedDocs = await db.document.findMany({
      where: {
        collaborators: {
          some: {
            userId: user.id,
            role: { in: ["EDITOR", "VIEWER"] },
          },
        },
        ownerId: { not: user.id },
      },
      orderBy: { updatedAt: "desc" },
      include: { collaborators: true },
      take: 10,
    });

    return (
      <div className="bg-background flex min-h-screen flex-col">
        {/* Navbar */}
        <nav className="bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-6 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📝</span>
            <h1 className="text-xl font-bold">CollabDoc</h1>
          </div>
          <div className="flex items-center gap-3">
            <SyncStatusWrapper />
            <ThemeToggle />
            <div className="flex items-center gap-2 rounded-full border px-3 py-1">
              <div className="bg-primary/20 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold">
                {session.user.name?.[0]?.toUpperCase()}
              </div>
              <span className="text-sm font-medium">{session.user.name}</span>
            </div>
            <Link href="/api/auth/signout">
              <Button variant="outline" size="sm">
                Sign out
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="from-primary/5 via-background to-background border-b bg-gradient-to-br px-6 py-10">
          <div className="mx-auto max-w-4xl">
            <h2 className="mb-2 text-3xl font-bold">
              Welcome back, {session.user.name?.split(" ")[0]} 👋
            </h2>
            <p className="text-muted-foreground">
              Your documents are synced and ready to edit.
            </p>
          </div>
        </div>

        {/* Main */}
        <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">My Documents</h3>
              <p className="text-muted-foreground mt-0.5 text-sm">
                {totalDocuments} document{totalDocuments !== 1 ? "s" : ""}
              </p>
            </div>
            <CreateDocumentButton />
          </div>

          {documents.length === 0 ? (
            <div className="mb-8 rounded-xl border-2 border-dashed p-12 text-center">
              <p className="mb-3 text-4xl">📄</p>
              <p className="text-lg font-medium">No documents yet</p>
              <p className="text-muted-foreground mt-1 mb-4 text-sm">
                Create your first document to get started
              </p>
              <CreateDocumentButton />
            </div>
          ) : (
            <>
              <div className="mb-6 grid gap-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="hover:bg-accent hover:border-primary/30 group relative flex items-center justify-between rounded-xl border p-4 transition-all"
                  >
                    <Link
                      href={`/editor/${doc.id}`}
                      className="flex flex-1 items-center gap-3"
                    >
                      <span className="text-2xl">📄</span>
                      <div>
                        <h4 className="group-hover:text-primary font-medium transition-colors">
                          {doc.title}
                        </h4>
                        <p className="text-muted-foreground mt-0.5 text-xs">
                          Updated{" "}
                          {new Date(doc.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </Link>
                    <div className="ml-4 flex shrink-0 items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {doc.collaborators.length} collaborator
                        {doc.collaborators.length !== 1 ? "s" : ""}
                      </Badge>
                      <DeleteDocumentButton
                        documentId={doc.id}
                        documentTitle={doc.title}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mb-10 flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard?page=${Math.max(1, currentPage - 1)}`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                      >
                        ← Previous
                      </Button>
                    </Link>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(
                          (p) =>
                            p === 1 ||
                            p === totalPages ||
                            Math.abs(p - currentPage) <= 1,
                        )
                        .map((p, idx, arr) => (
                          <span key={p} className="flex items-center">
                            {idx > 0 && arr[idx - 1] !== p - 1 && (
                              <span className="text-muted-foreground px-1">
                                ...
                              </span>
                            )}
                            <Link href={`/dashboard?page=${p}`}>
                              <Button
                                variant={
                                  p === currentPage ? "default" : "outline"
                                }
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                {p}
                              </Button>
                            </Link>
                          </span>
                        ))}
                    </div>
                    <Link
                      href={`/dashboard?page=${Math.min(totalPages, currentPage + 1)}`}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages}
                      >
                        Next →
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Shared with me */}
          {sharedDocs.length > 0 && (
            <>
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold">Shared with me</h3>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {sharedDocs.length} document
                    {sharedDocs.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="grid gap-3">
                {sharedDocs.map((doc) => {
                  const myRole = doc.collaborators.find(
                    (c) => c.userId === user.id,
                  )?.role;
                  return (
                    <Link key={doc.id} href={`/editor/${doc.id}`}>
                      <div className="hover:bg-accent hover:border-primary/30 group cursor-pointer rounded-xl border p-4 transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🤝</span>
                            <div>
                              <h4 className="group-hover:text-primary font-medium transition-colors">
                                {doc.title}
                              </h4>
                              <p className="text-muted-foreground mt-0.5 text-xs">
                                Updated{" "}
                                {new Date(doc.updatedAt).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  },
                                )}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              myRole === "EDITOR" ? "default" : "secondary"
                            }
                            className="text-xs"
                          >
                            {myRole}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          )}
        </main>

        {/* Footer */}
        <footer className="text-muted-foreground mt-auto border-t px-6 py-4 text-center text-sm">
          Built by{" "}
          <a
            href="https://github.com/Etikumawat/document-editor"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground font-medium underline"
          >
            Eti Kumawat
          </a>{" "}
          ·{" "}
          <a
            href="https://www.linkedin.com/in/eti-kumawat-5502bb247/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground font-medium underline"
          >
            LinkedIn
          </a>
        </footer>
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="max-w-md text-center">
          <h1 className="mb-2 text-2xl font-bold text-red-500">
            Database Error
          </h1>
          <p className="text-muted-foreground mb-4">
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
          <Link href="/api/auth/signout" className="underline">
            Sign out and try again
          </Link>
        </div>
      </div>
    );
  }
}

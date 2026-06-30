import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import EditorWrapper from "~/components/ui/editor-wrapper";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email) redirect("/api/auth/signin");

  const user = await db.user.findUnique({
    where: { email: session.user.email },
  });

  if (!user) redirect("/dashboard");

  const document = await db.document.findUnique({
    where: { id },
    include: { collaborators: true },
  });

  if (!document) redirect("/dashboard");

  const collaborator = document.collaborators.find((c) => c.userId === user.id);

  if (!collaborator) redirect("/dashboard");

  return (
    <EditorWrapper
      documentId={id}
      initialContent={document.content}
      initialTitle={document.title}
      role={collaborator.role}
      userName={session.user.name ?? "Anonymous"}
    />
  );
}

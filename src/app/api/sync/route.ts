import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { z } from "zod";
const SyncPayload = z.object({
  documentId: z.string().cuid(),
  type: z.enum(["CREATE", "UPDATE"]),
  title: z.string().max(500),
  content: z.string().max(500000),
  timestamp: z.number(),
});
export async function POST(req: Request) {
  try {
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1_000_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const session = await auth();
    console.log("=== SYNC DEBUG ===");
    console.log("Session:", JSON.stringify(session));

    if (!session?.user?.email) {
      console.log("No session email - 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
    });

    console.log("User found:", user);

    if (!user) {
      console.log("No user - 404");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await req.json()) as unknown;
    const parsed = SyncPayload.safeParse(body);
    if (!parsed.success) {
      console.log("Invalid payload:", parsed.error);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { documentId, type, title, content } = parsed.data;

    console.log(
      "Looking for collaborator with documentId:",
      documentId,
      "userId:",
      user.id,
    );

    const collaborator = await db.collaborator.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId: user.id,
        },
      },
    });

    console.log("Collaborator found:", collaborator);

    if (!collaborator || collaborator.role === "VIEWER") {
      console.log("Forbidden - no collaborator or viewer role");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.document.update({
      where: { id: documentId },
      data: { title, content },
    });

    console.log("SUCCESS");
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Sync error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

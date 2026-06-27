import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { z } from "zod";

// Security: limit payload size + validate shape
const SyncPayload = z.object({
  documentId: z.string().cuid(),
  type: z.enum(["CREATE", "UPDATE"]),
  title: z.string().max(500),
  content: z.string().max(500000), // 500KB max
  timestamp: z.number(),
});

export async function POST(req: Request) {
  try {
    // Security: block oversized payloads
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 1_000_000) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as unknown;
    const parsed = SyncPayload.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { documentId, type, title, content } = parsed.data;

    // Check user has permission
    const collaborator = await db.collaborator.findUnique({
      where: {
        documentId_userId: {
          documentId,
          userId: session.user.id,
        },
      },
    });

    // Viewers cannot push updates
    if (!collaborator || collaborator.role === "VIEWER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (type === "CREATE") {
      await db.document.update({
        where: { id: documentId },
        data: { title, content },
      });
    } else {
      await db.document.update({
        where: { id: documentId },
        data: { title, content },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { z } from "zod";

const SharePayload = z.object({
  email: z.string().email(),
  role: z.enum(["EDITOR", "VIEWER"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only owner can share
    const document = await db.document.findUnique({
      where: { id },
    });
    // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
    if (!document || document.ownerId !== session?.user?.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json()) as unknown;
    const parsed = SharePayload.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const { email, role } = parsed.data;

    // Find user by email
    const targetUser = await db.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found. They must sign in first." },
        { status: 404 },
      );
    }

    // Add collaborator
    const collaborator = await db.collaborator.upsert({
      where: {
        documentId_userId: {
          documentId: id,
          userId: targetUser.id,
        },
      },
      update: { role },
      create: {
        documentId: id,
        userId: targetUser.id,
        role,
      },
    });

    return NextResponse.json(collaborator);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { auth } from "~/server/auth";
import { db } from "~/server/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.user.findUnique({
      where: { email: session.user.email },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const document = await db.document.findUnique({
      where: { id },
    });

    if (!document) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (document.ownerId !== currentUser.id) {
      return NextResponse.json(
        { error: "Only the owner can delete this document" },
        { status: 403 },
      );
    }

    await db.document.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

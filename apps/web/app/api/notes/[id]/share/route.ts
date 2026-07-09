import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../lib/auth"; // Adjust to your actual auth.ts path
import { prisma } from "@repo/db/config";
import { randomUUID } from "crypto";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { isPublic } = body;

    // Verify ownership before altering share properties
    const existingNote = await prisma.note.findUnique({
      where: { id },
    });

    if (!existingNote || existingNote.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If making public and it doesn't have a shareId yet, generate one
    const shareId = existingNote.shareId || randomUUID();

    const updatedNote = await prisma.note.update({
      where: { id },
      data: {
        isPublic,
        shareId,
      },
    });

    return NextResponse.json(
      { isPublic: updatedNote.isPublic, shareId: updatedNote.shareId },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/notes/[id]/share error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
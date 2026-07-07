import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth"; // Adjust to your actual auth.ts path
import { prisma } from "@repo/db/config";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 1. Type params as a Promise
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Await the params to resolve the note id
    const { id } = await params;

    const body = await req.json();
    const { title, content, isPublic } = body;

    const existingNote = await prisma.note.findUnique({
      where: { id: id },
    });

    if (!existingNote || existingNote.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedNote = await prisma.note.update({
      where: { id: id },
      data: {
        ...(title !== undefined && { title }),
        ...(content !== undefined && { content }),
        ...(isPublic !== undefined && { isPublic }),
      },
    });

    return NextResponse.json({ note: updatedNote }, { status: 200 });
  } catch (error) {
    console.error("PATCH /api/notes/[id] error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
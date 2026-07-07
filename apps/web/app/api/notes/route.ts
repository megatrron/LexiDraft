import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth"; // Adjust to your actual auth.ts path
import { prisma } from "@repo/db/config";

// -----------------------------------------------------------------------------
// GET: Fetch all notes for the authenticated user
// -----------------------------------------------------------------------------
export async function GET(req: Request) {
  try {
    // 1. Secure the route using NextAuth v4
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Extract userId from query parameters
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // 3. Validate that the requesting user is asking for their own notes
    if (!userId || userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Query the database
    const notes = await prisma.note.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        shareId: true,
        isPublic: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ notes }, { status: 200 });
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// POST: Create a new note
// -----------------------------------------------------------------------------
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, userId } = body;

    if (!userId || userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const newNote = await prisma.note.create({
      data: {
        title: title || "Untitled Note",
        content: "", 
        userId: session.user.id,
      },
    });

    return NextResponse.json({ note: newNote }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// -----------------------------------------------------------------------------
// DELETE: Delete a specific note
// -----------------------------------------------------------------------------
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const noteId = searchParams.get("id");

    if (!noteId) {
      return NextResponse.json({ error: "Missing note ID" }, { status: 400 });
    }

    const existingNote = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!existingNote || existingNote.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found or Forbidden" }, { status: 404 });
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return NextResponse.json({ message: "Note deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/notes error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
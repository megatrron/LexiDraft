import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth"; // Adjust to your actual auth.ts path
import { prisma } from "@repo/db/config";
import { redirect } from "next/navigation";
import EditorClient from "./EditorClient";
import React from "react";
// 1. Change params to a Promise type
interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditorPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  // 2. Await the params to extract the id
  const { id } = await params;

  // Fetch the note securely using the resolved id
  const note = await prisma.note.findUnique({
    where: { 
      id: id,
      userId: session.user.id 
    },
  });

  if (!note) {
    redirect("/dashboard");
  }

  return <EditorClient note={note} />;
}
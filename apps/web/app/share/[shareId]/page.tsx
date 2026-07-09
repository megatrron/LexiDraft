import { prisma } from "@repo/db/config";
import { notFound } from "next/navigation";

interface SharePageProps {
  params: Promise<{ shareId: string }>;
}

export default async function PublicSharePage({ params }: SharePageProps) {
  const { shareId } = await params;

  // Retrieve the note strictly matching the share token and active public flag
  const note = await prisma.note.findFirst({
    where: {
      shareId: shareId,
      isPublic: true,
    },
  });

  if (!note) {
    notFound(); // Triggers standard 404 page if note isn't public or doesn't exist
  }

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans selection:bg-zinc-200 py-16 px-6">
      <article className="max-w-2xl mx-auto bg-white border border-zinc-100 rounded-2xl p-8 sm:p-12 shadow-sm">
        <header className="mb-8 border-b border-zinc-100 pb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full mb-4">
            🌐 Public Shared Note
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            {note.title || "Untitled Note"}
          </h1>
        </header>

        {/* Render the structural HTML output neatly inside the Typography container */}
        <main 
          className="prose prose-zinc prose-lg max-w-none focus:outline-none"
          dangerouslySetInnerHTML={{ __html: note.content || "<p class='text-zinc-400 italic'>This note has no content.</p>" }}
        />
      </article>
    </div>
  );
}
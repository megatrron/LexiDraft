import { prisma } from "@repo/db/config";
import { notFound } from "next/navigation";
import { SharePrintButton } from "../../components/SharePrintButton";

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
    // Added print:py-0 to remove top/bottom outer canvas paddings when printing
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 font-sans selection:bg-zinc-200 py-16 px-6 print:py-0 print:px-0 print:bg-white">

      {/* Added print:border-none and print:shadow-none to remove the card container layout decoration on the PDF */}
      <article className="max-w-2xl mx-auto bg-white border border-zinc-100 rounded-2xl p-8 sm:p-12 shadow-sm print:border-none print:shadow-none print:p-0">

        <header className="mb-8 border-b border-zinc-100 pb-6 print:pb-4 print:mb-6">

          {/* Flex wrapper to space out the badge and the new download button cleanly */}
          <div className="flex items-center justify-between gap-4 mb-4 print:hidden">
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-zinc-50 border border-zinc-100 px-2.5 py-1 rounded-full">
              🌐 Public Shared Note
            </div>

            {/* 2. Insert the client-side print trigger */}
            <SharePrintButton />
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">
            {note.title || "Untitled Note"}
          </h1>
        </header>

        <main
          className="prose prose-zinc prose-lg max-w-none focus:outline-none print:prose-black"
          dangerouslySetInnerHTML={{ __html: note.content || "<p class='text-zinc-400 italic'>This note has no content.</p>" }}
        />
      </article>
    </div>
  );
}
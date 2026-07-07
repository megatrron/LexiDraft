"use client";

import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import debounce from "lodash.debounce";
import axios from "axios";
import Link from "next/link";
import LinkExtension from "@tiptap/extension-link";

interface Note {
    id: string;
    title: string;
    content: string;
    isPublic: boolean;
    shareId: string;
}

type AiAction = "polish" | "expand" | "reference" | "tldr";

export default function EditorClient({ note }: { note: Note }): React.JSX.Element {
    const [title, setTitle] = useState(note.title);
    const [saveStatus, setSaveStatus] = useState<"Saved" | "Saving..." | "Error">("Saved");

    // AI States
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const debouncedSave = useRef(
        debounce(async (id: string, newTitle: string, newContent: string) => {
            setSaveStatus("Saving...");
            try {
                await axios.patch(`/api/notes/${id}`, {
                    title: newTitle,
                    content: newContent,
                });
                setSaveStatus("Saved");
            } catch (error) {
                console.error("Autosave failed", error);
                setSaveStatus("Error");
            }
        }, 1500)
    ).current;

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsAiMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        return () => {
            debouncedSave.cancel();
        };
    }, [debouncedSave]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        setSaveStatus("Saving...");
        debouncedSave(note.id, newTitle, editor?.getHTML() || "");
    };

    const editor = useEditor({
        extensions: [
            StarterKit,
            // 2. Register the Link extension with safe defaults
            LinkExtension.configure({
                openOnClick: true,
                autolink: true,
                defaultProtocol: "https",
                HTMLAttributes: {
                    class: "text-zinc-900 underline underline-offset-4 font-medium hover:text-zinc-600 transition-colors cursor-pointer",
                    target: "_blank",
                    rel: "noopener noreferrer",
                },
            }),
            Placeholder.configure({
                placeholder: "Start writing your draft here...",
                emptyEditorClass: 'is-editor-empty',
            }),
        ],
        content: note.content,
        editorProps: {
            attributes: {
                class: "prose prose-zinc prose-lg max-w-none focus:outline-none min-h-[500px] pb-32",
            },
        },
        onUpdate: ({ editor }) => {
            setSaveStatus("Saving...");
            debouncedSave(note.id, title, editor.getHTML());
        },
    });

    // ---------------------------------------------------------------------------
    // Core AI Actions Router
    // ---------------------------------------------------------------------------
    const runAiAction = async (action: AiAction) => {
        if (!editor) return;

        setIsAiMenuOpen(false);
        setIsAiLoading(true);
        setSaveStatus("Saving...");

        try {
            const currentContent = editor.getText();

            // Get currently selected text (useful if they want to expand or polish a specific sentence)
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, " ");

            const response = await axios.post("/api/ai", {
                action,
                currentContent,
                selectedText: selectedText || null,
            });

            const aiText = response.data.text;
            if (!aiText) return;

            // Execute Tiptap text transformation strategies based on choices
            if (action === "tldr") {
                // 1. Insert TL;DR right at the top
                editor.chain().focus().insertContentAt(0, `<p><strong>TL;DR:</strong> ${aiText}</p><hr />`).run();
            } else if (action === "reference") {
                // Append reference guide cleanly at the very bottom as parsed HTML
                const endOfDoc = editor.state.doc.content.size;
                editor
                    .chain()
                    .focus()
                    .insertContentAt(endOfDoc, `<br /><hr /><div>${aiText}</div>`)
                    .run();
            } else if (action === "polish" || action === "expand") {
                // 3. Inline Replacement/Extension
                if (selectedText) {
                    // If a user highlighted text, swap it directly out with the optimized version
                    editor.chain().focus().insertContent(aiText).run();
                } else {
                    // Otherwise append inline where the cursor currently rests
                    editor.chain().focus().insertContent(`\n${aiText}\n`).run();
                }
            }

            // Sync mutations back to DB
            debouncedSave(note.id, title, editor.getHTML());
        } catch (error) {
            console.error("AI Action execution failed:", error);
            alert("Something went wrong with the AI block. Check your server logs.");
        } finally {
            setIsAiLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
            {/* Editor Navbar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 h-14 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                        ← Dashboard
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium transition-colors ${saveStatus === 'Error' ? 'text-red-500' : 'text-zinc-400'}`}>
                        {saveStatus}
                    </span>
                    <button className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors">
                        Share
                    </button>

                    {/* Actionable Dropdown Menu Container */}
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => !isAiLoading && setIsAiMenuOpen(!isAiMenuOpen)}
                            disabled={isAiLoading}
                            className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white transition-colors shadow-sm flex items-center gap-2"
                        >
                            {isAiLoading ? "Processing..." : "✨ AI Assistant"}
                        </button>

                        {isAiMenuOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-100">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    Writing Tools
                                </div>

                                <button
                                    onClick={() => runAiAction("polish")}
                                    className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex flex-col gap-0.5 transition-colors"
                                >
                                    <span className="text-xs font-semibold text-zinc-800">✨ Polish & Refine</span>
                                    <span className="text-[11px] text-zinc-500">Fixes grammar, flow, and cleans tone.</span>
                                </button>

                                <button
                                    onClick={() => runAiAction("expand")}
                                    className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex flex-col gap-0.5 transition-colors"
                                >
                                    <span className="text-xs font-semibold text-zinc-800">📈 Expand & Elaborate</span>
                                    <span className="text-[11px] text-zinc-500">Turn bullet points into clean prose.</span>
                                </button>

                                <div className="h-px bg-zinc-100 my-1" />
                                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                                    Document Helpers
                                </div>

                                <button
                                    onClick={() => runAiAction("tldr")}
                                    className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex flex-col gap-0.5 transition-colors"
                                >
                                    <span className="text-xs font-semibold text-zinc-800">⚡ Generate TL;DR</span>
                                    <span className="text-[11px] text-zinc-500">Inserts a 2-sentence summary at the top.</span>
                                </button>

                                <button
                                    onClick={() => runAiAction("reference")}
                                    className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex flex-col gap-0.5 transition-colors"
                                >
                                    <span className="text-xs font-semibold text-zinc-800">🔍 Add References & Context</span>
                                    <span className="text-[11px] text-zinc-500">Appends definitions and concepts at bottom.</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Editor Canvas */}
            <main className="max-w-3xl mx-auto px-6 pt-16">
                <input
                    type="text"
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Note Title"
                    className="w-full text-4xl sm:text-5xl font-bold bg-transparent border-none focus:outline-none focus:ring-0 text-zinc-900 placeholder:text-zinc-300 mb-8 tracking-tight"
                />

                <EditorContent editor={editor} />
            </main>
        </div>
    );
}
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import LinkExtension from "@tiptap/extension-link";
import debounce from "lodash.debounce";
import axios from "axios";
import Link from "next/link";

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

    // Share States
    const [isPublic, setIsPublic] = useState(note.isPublic);
    const [shareId, setShareId] = useState(note.shareId);
    const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
    const [copyLabel, setCopyLabel] = useState("Copy Link");

    // AI States
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);

    const aiMenuRef = useRef<HTMLDivElement>(null);
    const shareMenuRef = useRef<HTMLDivElement>(null);

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

    // Click outside listener for dropdown UI contexts
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (aiMenuRef.current && !aiMenuRef.current.contains(event.target as Node)) {
                setIsAiMenuOpen(false);
            }
            if (shareMenuRef.current && !shareMenuRef.current.contains(event.target as Node)) {
                setIsShareMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        setSaveStatus("Saving...");
        debouncedSave(note.id, newTitle, editor?.getHTML() || "");
    };

    const editor = useEditor({
        extensions: [
            StarterKit,
            LinkExtension.configure({
                openOnClick: true,
                autolink: true,
                HTMLAttributes: {
                    class: "text-zinc-900 underline underline-offset-4 font-medium hover:text-zinc-600 cursor-pointer",
                    target: "_blank",
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
                spellcheck: "false",
                class: "prose prose-zinc prose-lg max-w-none focus:outline-none min-h-[500px] pb-32 border border-zinc-100 rounded-xl p-6 shadow-sm bg-white",
            },
        },
        onUpdate: ({ editor }) => {
            setSaveStatus("Saving...");
            debouncedSave(note.id, title, editor.getHTML());
        },
    });

    // ---------------------------------------------------------------------------
    // Share Feature Logic
    // ---------------------------------------------------------------------------
    const toggleShareSettings = async () => {
        const targetState = !isPublic;
        try {
            const response = await axios.post(`/api/notes/${note.id}/share`, {
                isPublic: targetState,
            });
            setIsPublic(response.data.isPublic);
            if (response.data.shareId) {
                setShareId(response.data.shareId);
            }
        } catch (error) {
            console.error("Failed to alter visibility settings", error);
        }
    };

    const copyShareLink = () => {
        if (!shareId) return;
        const shareUrl = `${window.location.origin}/share/${shareId}`;
        navigator.clipboard.writeText(shareUrl);
        setCopyLabel("Copied!");
        setTimeout(() => setCopyLabel("Copy Link"), 2000);
    };

    const runAiAction = async (action: AiAction) => {
        if (!editor) return;
        setIsAiMenuOpen(false);
        setIsAiLoading(true);
        setSaveStatus("Saving...");

        try {
            const currentContent = editor.getText();
            const { from, to } = editor.state.selection;
            const selectedText = editor.state.doc.textBetween(from, to, " ");

            const response = await axios.post("/api/ai", {
                action,
                currentContent,
                selectedText: selectedText || null,
            });

            let aiText = response.data.text;
            if (!aiText) return;

            aiText = aiText.replace(/^```html\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "").trim();

            if (action === "tldr") {
                editor.chain().focus().insertContentAt(0, `<p><strong>TL;DR:</strong> ${aiText}</p><hr />`).run();
            } else if (action === "reference") {
                const endOfDoc = editor.state.doc.content.size;
                editor.chain().focus().insertContentAt(endOfDoc, `<br /><hr /><div>${aiText}</div>`).run();
            } else if (action === "polish" || action === "expand") {
                if (selectedText) {
                    editor.chain().focus().insertContent(aiText).run();
                } else {
                    editor.chain().focus().insertContent(`<p>${aiText}</p>`).run();
                }
            }
            debouncedSave(note.id, title, editor.getHTML());
        } catch (error) {
            console.error("AI action failed", error);
        } finally {
            setIsAiLoading(false);
        }
    };

    // ---------------------------------------------------------------------------
    // PDF Export Logic
    // ---------------------------------------------------------------------------
    const [isExporting, setIsExporting] = useState(false);

    const exportToPDF = async () => {
        window.print();
    };
    return (
        <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
            <header className="print:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100 h-14 flex items-center justify-between px-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                        ← Dashboard
                    </Link>
                </div>

                <div className="flex items-center gap-4">
                    <span className={`text-xs font-medium transition-colors ${saveStatus === 'Error' ? 'text-red-500' : 'text-zinc-400'}`}>
                        {saveStatus}
                    </span>

                    {/* Share Control Dropdown */}
                    <div className="relative" ref={shareMenuRef}>
                        <button
                            onClick={() => setIsShareMenuOpen(!isShareMenuOpen)}
                            className={`h-8 px-3 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1.5 ${isPublic ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'}`}
                        >
                            <span>Share</span>
                            {isPublic && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                        </button>

                        {isShareMenuOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-white border border-zinc-200 rounded-xl shadow-xl p-4 z-50">
                                <h4 className="text-xs font-bold text-zinc-800 mb-1">Share settings</h4>
                                <p className="text-[11px] text-zinc-500 mb-4">Publishing this allows anyone with the web link to review this entry.</p>

                                <div className="flex items-center justify-between bg-zinc-50 border border-zinc-100 p-2 rounded-lg mb-3">
                                    <span className="text-xs font-medium text-zinc-600">Publish to Web</span>
                                    <input
                                        type="checkbox"
                                        checked={isPublic}
                                        onChange={toggleShareSettings}
                                        className="w-4 h-4 text-zinc-900 bg-zinc-100 border-zinc-300 rounded focus:ring-zinc-900 focus:ring-2"
                                    />
                                </div>

                                {isPublic && (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${shareId}`}
                                            className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1 text-[11px] font-mono text-zinc-500 select-all outline-none"
                                        />
                                        <button
                                            onClick={copyShareLink}
                                            className="px-3 py-1 bg-zinc-900 text-white text-[11px] font-medium rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
                                        >
                                            {copyLabel}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {/* 👇 NEW: The PDF Export Button 👇 */}
                    <button 
                        onClick={exportToPDF}
                        disabled={isExporting}
                        className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 disabled:bg-zinc-50 disabled:text-zinc-400 text-zinc-700 transition-colors flex items-center gap-1.5"
                    >
                        {isExporting ? "Exporting..." : "📄 Download PDF"}
                    </button>
                    {/* AI Control Dropdown */}
                    <div className="relative" ref={aiMenuRef}>
                        <button
                            onClick={() => !isAiLoading && setIsAiMenuOpen(!isAiMenuOpen)}
                            disabled={isAiLoading}
                            className="h-8 px-3 rounded-lg text-xs font-medium bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-400 text-white transition-colors shadow-sm"
                        >
                            {isAiLoading ? "Processing..." : "✨ AI Assistant"}
                        </button>

                        {isAiMenuOpen && (
                            <div className="absolute right-0 mt-2 w-72 bg-white border border-zinc-200 rounded-xl shadow-xl py-2 z-50">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Writing Tools</div>
                                <button onClick={() => runAiAction("polish")} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex flex-col gap-0.5"><span className="text-xs font-semibold text-zinc-800">✨ Polish & Refine</span><span className="text-[11px] text-zinc-500">Fixes grammar, flow, and cleans tone.</span></button>
                                <button onClick={() => runAiAction("expand")} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex flex-col gap-0.5"><span className="text-xs font-semibold text-zinc-800">📈 Expand & Elaborate</span><span className="text-[11px] text-zinc-500">Turn bullet points into clean prose.</span></button>
                                <div className="h-px bg-zinc-100 my-1" />
                                <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Document Helpers</div>
                                <button onClick={() => runAiAction("tldr")} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex flex-col gap-0.5"><span className="text-xs font-semibold text-zinc-800">⚡ Generate TL;DR</span><span className="text-[11px] text-zinc-500">Inserts a 2-sentence summary at the top.</span></button>
                                <button onClick={() => runAiAction("reference")} className="w-full text-left px-4 py-2 hover:bg-zinc-50 flex flex-col gap-0.5"><span className="text-xs font-semibold text-zinc-800">🔍 Add References & Context</span><span className="text-[11px] text-zinc-500">Appends definitions and concepts at bottom.</span></button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main id="pdf-export-area" className="max-w-3xl mx-auto px-6 pt-16 pb-16 bg-white print:pt-0 print:px-0">
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
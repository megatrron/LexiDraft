"use client";

import React, { useEffect, useRef, useState } from "react";
import { Session } from "next-auth";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

interface Note {
  id: string;
  title: string;
  shareId: string;
  isPublic: boolean;
  updatedAt: string;
}

export const Dashboard = ({ user }: { user: Session["user"] }): React.JSX.Element => {
  const router = useRouter();

  // UI State
  const [profileOpen, setProfileOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [openSharedModal, setOpenSharedModal] = useState(false);
  const [noteDropdownOpen, setNoteDropdownOpen] = useState<string | null>(null);

  // Data State
  const [title, setTitle] = useState("");
  const [sharedLinkId, setSharedLinkId] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);

  // Refs for click-outside handling
  const profileDropdownRef = useRef<HTMLDivElement | null>(null);
  const createModalRef = useRef<HTMLDivElement | null>(null);
  const sharedModalRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------------------------------------------------------
  // API Callbacks (Adapted for LexiDraft)
  // ---------------------------------------------------------------------------
  const fetchNotes = async () => {
    try {
      const res = await axios.get(`/api/notes?userId=${user.id}`);
      setNotes(res.data.notes);
    } catch (error) {
      console.error("Failed to fetch notes:", error);
    }
  };

  useEffect(() => {
    fetchNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleCreateNote = async () => {
    try {
      const response = await axios.post("/api/notes", {
        title: title || "Untitled Note",
        userId: user.id,
      });
      const newNote = response.data.note;
      setNotes((prev) => [...prev, newNote]);
      setTitle("");
      setCreateModalOpen(false);
      
      // Optionally route directly to the new note's editor
      // router.push(`/editor/${newNote.id}`);
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const handleOpenSharedNote = () => {
    if (!sharedLinkId.trim()) return;
    // Route to the public read-only view using the shareId
    router.push(`/share/${sharedLinkId}`);
    setOpenSharedModal(false);
    setSharedLinkId("");
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await axios.delete(`/api/notes?id=${noteId}`);
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      setNoteDropdownOpen(null);
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleCopyShareLink = (shareId: string) => {
    // Construct the full URL based on the current origin
    const url = `${window.location.origin}/share/${shareId}`;
    navigator.clipboard.writeText(url);
    alert("Share link copied to clipboard!");
    setNoteDropdownOpen(null);
  };

  // ---------------------------------------------------------------------------
  // Click-Outside Listeners
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
      if (createModalOpen && createModalRef.current && !createModalRef.current.contains(event.target as Node)) {
        setCreateModalOpen(false);
      }
      if (openSharedModal && sharedModalRef.current && !sharedModalRef.current.contains(event.target as Node)) {
        setOpenSharedModal(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [createModalOpen, openSharedModal]);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-zinc-900 rounded-lg flex items-center justify-center">
            <span className="text-white font-serif italic font-bold">L</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">LexiDraft</span>
        </div>

        <div className="relative" ref={profileDropdownRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            className="flex items-center gap-3 hover:bg-zinc-100 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-zinc-200"
          >
            <div className="h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-sm font-medium text-zinc-600">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
            <span className="text-sm font-medium hidden sm:block">{user?.name}</span>
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 mt-2 w-48 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl z-50 border border-zinc-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-zinc-100">
                <p className="text-sm text-zinc-900 truncate">{user?.name}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
              <ul className="py-1 text-sm text-zinc-700">
                <li>
                  <button className="w-full text-left px-4 py-2 hover:bg-zinc-50 transition-colors">Settings</button>
                </li>
                <li>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                    onClick={() => signOut()}
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <h1 className="text-3xl font-semibold tracking-tight">My Notes</h1>
          
          <div className="flex items-center gap-3 relative">
            {/* Open Shared Note Button */}
            <button
              onClick={() => setOpenSharedModal((prev) => !prev)}
              className="px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-50 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
            >
              Open Shared Note
            </button>

            {/* Create Note Button */}
            <button
              onClick={() => setCreateModalOpen((prev) => !prev)}
              className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
            >
              + New Note
            </button>

            {/* Create Note Modal Dropdown */}
            {createModalOpen && (
              <div ref={createModalRef} className="absolute top-12 right-0 w-80 bg-white shadow-xl rounded-2xl p-5 border border-zinc-200 z-50">
                <h2 className="text-sm font-semibold mb-3">Create New Note</h2>
                <input
                  type="text"
                  placeholder="Untitled Note"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                  className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setCreateModalOpen(false)} className="px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancel</button>
                  <button onClick={handleCreateNote} className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">Create</button>
                </div>
              </div>
            )}

            {/* Open Shared Modal Dropdown */}
            {openSharedModal && (
              <div ref={sharedModalRef} className="absolute top-12 right-32 w-80 bg-white shadow-xl rounded-2xl p-5 border border-zinc-200 z-50">
                <h2 className="text-sm font-semibold mb-3">Open Shared Note</h2>
                <input
                  type="text"
                  placeholder="Enter Share ID (e.g., cm1a2b3c...)"
                  value={sharedLinkId}
                  onChange={(e) => setSharedLinkId(e.target.value)}
                  autoFocus
                  className="w-full border border-zinc-200 rounded-xl p-2.5 text-sm mb-4 focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setOpenSharedModal(false)} className="px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 rounded-lg">Cancel</button>
                  <button onClick={handleOpenSharedNote} className="px-3 py-1.5 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-800">Open</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Notes Grid */}
        {notes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-3xl bg-white">
            <p className="text-zinc-500 mb-4">You haven't created any notes yet.</p>
            <button onClick={() => setCreateModalOpen(true)} className="text-sm font-medium text-zinc-900 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-900 transition-all">
              Start writing →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((note) => (
              <div
                key={note.id}
                className="group relative bg-white h-40 p-5 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-md hover:border-zinc-300 transition-all flex flex-col justify-between"
              >
                {/* Note Header & Settings Menu */}
                <div className="flex justify-between items-start">
                  <div 
                    className="cursor-pointer flex-1"
                    onClick={() => router.push(`/editor/${note.id}`)}
                  >
                    <h3 className="font-semibold text-lg text-zinc-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {note.title}
                    </h3>
                  </div>

                  <div className="relative z-20 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setNoteDropdownOpen((prev) => (prev === note.id ? null : note.id));
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                    >
                      {/* Simple 3-dots SVG replacing the old SettingsIcon */}
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1" />
                        <circle cx="12" cy="5" r="1" />
                        <circle cx="12" cy="19" r="1" />
                      </svg>
                    </button>

                    {noteDropdownOpen === note.id && (
                      <div className="absolute right-0 top-8 mt-1 w-40 bg-white shadow-lg rounded-xl z-50 border border-zinc-200 overflow-hidden">
                        <ul className="py-1 text-sm text-zinc-700">
                          <li>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-zinc-50 transition-colors"
                              onClick={() => handleCopyShareLink(note.shareId)}
                            >
                              Copy Share Link
                            </button>
                          </li>
                          <div className="h-px bg-zinc-100 my-1" />
                          <li>
                            <button
                              className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 transition-colors"
                              onClick={() => handleDeleteNote(note.id)}
                            >
                              Delete Note
                            </button>
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Note Footer (Timestamp) */}
                <div 
                  className="cursor-pointer text-xs text-zinc-400 font-medium"
                  onClick={() => router.push(`/editor/${note.id}`)}
                >
                  Last edited {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};